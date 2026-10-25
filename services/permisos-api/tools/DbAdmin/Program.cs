using System.Text.Json;
using Dapper;
using Microsoft.Data.SqlClient;
using System.Security.Cryptography;
using Permisos.Api;

var jsonOptions = new JsonDocumentOptions { CommentHandling = JsonCommentHandling.Skip, AllowTrailingCommas = true };
string? adminConnection = null;
foreach (var file in new[] { "appsettings.json", "appsettings.Development.json", "appsettings.Local.json" })
{
    var path = Path.Combine(@"C:\Proyectos\1.-DGMESNIE", file);
    if (!File.Exists(path)) continue;
    using var json = JsonDocument.Parse(File.ReadAllText(path), jsonOptions);
    if (json.RootElement.TryGetProperty("ConnectionStrings", out var strings) && strings.TryGetProperty("DefaultConnection", out var value)
        && !string.IsNullOrWhiteSpace(value.GetString())) adminConnection = value.GetString();
}
if (adminConnection is null) throw new Exception("No existe conexión de administración local.");
var builder = new SqlConnectionStringBuilder(adminConnection)
{
    DataSource = "servidorsqljavidev.database.windows.net", InitialCatalog = "BDPruebasSNIER", Encrypt = true,
    TrustServerCertificate = false, ConnectTimeout = 30
};
await using var connection = new SqlConnection(builder.ConnectionString);
await connection.OpenAsync();
var tables = new[] { "Electricidad_autorizado", "Expendios_autorizado", "GasLP_autorizado", "GasNatural_autorizado", "Ligas_Permisos_CNE", "Asignaciones_SENER", "Asignaciones_SENER_Municipios", "ComercioExterior_SENER_autorizado", "Contratos_EE_SENER", "Pozos_SENER", "Biocombustibles_SENER_autorizado", "Transporte_autorizado", "Comercializacion_autorizado", "Infraestructura_Hidrocarburos_autorizado", "Suministro_Electrico_autorizado", "Terceros_Acreditados_CNE", "Control_Actualizacion_CNE", "Control_Actualizacion_SENER", "Entidades_Federativas", "Municipios" };
if (args[0] == "schema")
{
    var rows = await connection.QueryAsync("""
        SELECT t.name AS tabla, c.name AS columna, ty.name AS tipo, c.max_length AS longitud, c.is_nullable AS nullable,
               c.column_id AS orden,
               CONVERT(bit, CASE WHEN EXISTS(SELECT 1 FROM sys.index_columns ic JOIN sys.indexes i ON i.object_id=ic.object_id AND i.index_id=ic.index_id
                   WHERE ic.object_id=t.object_id AND ic.column_id=c.column_id AND i.is_primary_key=1) THEN 1 ELSE 0 END) AS pk
        FROM sys.tables t JOIN sys.schemas s ON s.schema_id=t.schema_id
        JOIN sys.columns c ON c.object_id=t.object_id JOIN sys.types ty ON ty.user_type_id=c.user_type_id
        WHERE s.name='dbo' AND t.name IN @Tables ORDER BY t.name,c.column_id;
        """, new { Tables = tables });
    await File.WriteAllTextAsync(args[1], JsonSerializer.Serialize(rows, new JsonSerializerOptions { WriteIndented = true }));
    Console.WriteLine("Esquema guardado; tablas: " + rows.Select(r => (string)r.tabla).Distinct().Count());
}
if (args[0] == "indexes")
{
    var rows = await connection.QueryAsync("""
      SELECT t.name AS tabla,i.name AS indice,i.type_desc AS tipo,c.name AS columna,ic.key_ordinal,ic.is_included_column
      FROM sys.tables t JOIN sys.indexes i ON i.object_id=t.object_id
      JOIN sys.index_columns ic ON ic.object_id=i.object_id AND ic.index_id=i.index_id
      JOIN sys.columns c ON c.object_id=ic.object_id AND c.column_id=ic.column_id
      WHERE SCHEMA_NAME(t.schema_id)='dbo' AND t.name IN @Tables ORDER BY t.name,i.name,ic.key_ordinal;
      """,new { Tables=tables });
    await File.WriteAllTextAsync(args[1],JsonSerializer.Serialize(rows,new JsonSerializerOptions { WriteIndented=true }));
    Console.WriteLine("Índices inspeccionados sin cambios en SQL.");
}
if (args[0] == "performance-indexes")
{
    // Ruta fija: esta herramienta no ejecuta SQL arbitrario suministrado por HTTP ni por el usuario.
    await connection.ExecuteAsync(File.ReadAllText("services/permisos-api/sql/20261022-performance-indexes.sql"), commandTimeout: 180);
    Console.WriteLine("Cuatro índices de rendimiento comprobados/creados. Datos y permisos sin cambios.");
}
if (args[0] == "profile")
{
    foreach (var name in tables)
    {
        var field = name == "Pozos_SENER" ? "Estatus_pozo" : "Estatus";
        var exists = await connection.ExecuteScalarAsync<int>("SELECT COUNT(*) FROM sys.columns WHERE object_id=OBJECT_ID(@Name) AND name=@Field", new { Name = "dbo." + name, Field = field });
        if (exists == 0) continue;
        var rows = await connection.QueryAsync($"SELECT [{field}] AS estatus, COUNT(*) AS filas FROM dbo.[{name}] GROUP BY [{field}]");
        Console.WriteLine(name + ": " + JsonSerializer.Serialize(rows));
    }
}
if (args[0] == "provision")
{
    var output = Path.GetFullPath(args[1]);
    if (!Directory.Exists(output)) throw new Exception("Crea primero la carpeta privada de secretos.");
    const string user = "api_permisos_lectura";
    if (await connection.ExecuteScalarAsync<int>("SELECT COUNT(*) FROM sys.database_principals WHERE name=@User", new { User = user }) != 0)
        throw new Exception("El usuario SQL ya existe. No se rotará ni reemplazará automáticamente.");
    var password = "Ro!" + Convert.ToHexString(RandomNumberGenerator.GetBytes(32)) + "a9";
    await using var transaction = await connection.BeginTransactionAsync();
    await connection.ExecuteAsync("""
        DECLARE @statement nvarchar(max)=N'CREATE USER [api_permisos_lectura] WITH PASSWORD='+QUOTENAME(@Password,'''')+N';';
        EXEC sys.sp_executesql @statement;
        """, new { Password = password }, transaction);
    foreach (var table in tables)
        await connection.ExecuteAsync($"GRANT SELECT ON OBJECT::dbo.[{table}] TO [api_permisos_lectura]; DENY INSERT, UPDATE, DELETE ON OBJECT::dbo.[{table}] TO [api_permisos_lectura];", transaction: transaction);
    await connection.ExecuteAsync("""
        DENY CREATE TABLE, CREATE VIEW, CREATE PROCEDURE, CREATE FUNCTION, CREATE SYNONYM,
             CREATE TYPE, CREATE SCHEMA, ALTER ANY SCHEMA TO [api_permisos_lectura];
        """, transaction: transaction);
    await transaction.CommitAsync();
    var readOnly = new SqlConnectionStringBuilder(builder.ConnectionString)
    {
        UserID = user, Password = password, IntegratedSecurity = false, ApplicationIntent = ApplicationIntent.ReadOnly,
        ApplicationName = "SNIER.Permisos.ReadOnly", Pooling = true, MaxPoolSize = 20
    };
    var key = "snier_" + Convert.ToBase64String(RandomNumberGenerator.GetBytes(40)).TrimEnd('=').Replace('+','-').Replace('/','_');
    var settings = new Dictionary<string, string>
    {
        ["ConnectionStrings__ReadOnly"] = readOnly.ConnectionString,
        ["ApiClients__buscador__KeyHash"] = Convert.ToHexString(SHA256.HashData(System.Text.Encoding.UTF8.GetBytes(key))),
        ["ApiClients__buscador__Enabled"] = "true",
        ["ASPNETCORE_ENVIRONMENT"] = "Production",
        ["WEBSITE_RUN_FROM_PACKAGE"] = "1"
    };
    string[] scopes = ["mapa:read", "tablas:read", "detalle:read", "documentos:read", "actualizaciones:read"];
    for (var i=0; i<scopes.Length; i++) settings[$"ApiClients__buscador__Scopes__{i}"] = scopes[i];
    string[] datasets = ["electricidad", "petroliferos", "gas-lp", "gas-natural", "transporte", "comercializacion", "infraestructura", "suministro", "terceros", "asignaciones", "comercio-exterior", "contratos-ee", "pozos", "biocombustibles", "ligas"];
    for (var i=0; i<datasets.Length; i++) settings[$"ApiClients__buscador__Datasets__{i}"] = datasets[i];
    await File.WriteAllTextAsync(Path.Combine(output,"appsettings.azure.json"),JsonSerializer.Serialize(settings));
    await File.WriteAllTextAsync(Path.Combine(output,"buscador.key"),key);
    Console.WriteLine("Usuario SQL creado y permisos SELECT limitados a las 20 tablas. Secretos guardados en carpeta privada; no se imprimen.");
}
if (args[0] == "audit")
{
    var settings = JsonSerializer.Deserialize<Dictionary<string,string>>(File.ReadAllText(args[1]))!;
    await using var readOnly = new SqlConnection(settings["ConnectionStrings__ReadOnly"]);
    await readOnly.OpenAsync();
    var permissions = new List<object>();
    foreach (var table in tables)
    {
        var value = await readOnly.QuerySingleAsync("""
            SELECT USER_NAME() AS usuario,@Table AS tabla,
              HAS_PERMS_BY_NAME(@Table,'OBJECT','SELECT') AS puedeSelect,
              HAS_PERMS_BY_NAME(@Table,'OBJECT','INSERT') AS puedeInsert,
              HAS_PERMS_BY_NAME(@Table,'OBJECT','UPDATE') AS puedeUpdate,
              HAS_PERMS_BY_NAME(@Table,'OBJECT','DELETE') AS puedeDelete,
              HAS_PERMS_BY_NAME(@Table,'OBJECT','ALTER') AS puedeAlter;
            """, new { Table = "dbo." + table });
        if ((int)value.puedeSelect != 1 || (int)value.puedeInsert != 0 || (int)value.puedeUpdate != 0 || (int)value.puedeDelete != 0 || (int)value.puedeAlter != 0)
            throw new Exception("Privilegios incorrectos: " + table);
        await readOnly.ExecuteAsync($"SELECT TOP 0 * FROM dbo.[{table}];");
        permissions.Add(value);
    }
    var ddl = (await readOnly.QueryAsync<string>("SELECT permission_name FROM sys.fn_my_permissions(NULL,'DATABASE') WHERE permission_name LIKE 'CREATE %' OR permission_name LIKE 'ALTER %' OR permission_name IN ('CONTROL','INSERT','UPDATE','DELETE','EXECUTE')")).ToArray();
    if (ddl.Length != 0) throw new Exception("Privilegios de base excesivos.");
    var extraSelect = (await connection.QueryAsync<string>("""
        EXECUTE AS USER='api_permisos_lectura';
        SELECT SCHEMA_NAME(schema_id)+'.'+name FROM sys.tables
        WHERE HAS_PERMS_BY_NAME(QUOTENAME(SCHEMA_NAME(schema_id))+'.'+QUOTENAME(name),'OBJECT','SELECT')=1
          AND (SCHEMA_NAME(schema_id)<>'dbo' OR name NOT IN @Tables);
        REVERT;
        """, new { Tables = tables })).ToArray();
    if (extraSelect.Length != 0) throw new Exception("SELECT fuera de catálogo: " + string.Join(',', extraSelect));
    await File.WriteAllTextAsync(args[2],JsonSerializer.Serialize(new { tablas=permissions, privilegiosDdl=ddl, selectFueraCatalogo=extraSelect },new JsonSerializerOptions { WriteIndented=true }));
    Console.WriteLine("OK: 20 SELECT autorizados, DML/DDL denegados y cero tablas adicionales legibles.");
}
if (args[0] == "reference")
{
    var counts = new Dictionary<string,object>();
    foreach (var source in Catalog.Sources)
    {
        counts[source.Key] = await connection.QuerySingleAsync($"""
            SELECT COUNT_BIG(*) AS total,
             SUM(CASE WHEN Latitud_GEO BETWEEN 10 AND 36 AND Longitud_GEO BETWEEN -121 AND -82 THEN 1 ELSE 0 END) AS puntos
            FROM dbo.[{source.Table}];
            """);
    }
    var assignments = await connection.QueryAsync("""
        SELECT RTRIM(am.EF_ID) AS efId, COUNT(DISTINCT a.NumeroAsignacion) AS permisos
        FROM dbo.Asignaciones_SENER a
        JOIN dbo.Asignaciones_SENER_Municipios am ON am.NumeroAsignacion=a.NumeroAsignacion
        JOIN dbo.Entidades_Federativas e ON e.EF_ID=am.EF_ID
        WHERE a.Estatus=N'Vigente' GROUP BY am.EF_ID;
        """);
    await File.WriteAllTextAsync(args[1], JsonSerializer.Serialize(new { counts, asignacionesEstados=assignments }, new JsonSerializerOptions { WriteIndented=true }));
    Console.WriteLine("Conteos SQL de referencia guardados.");
}
if (args[0] == "diagnose")
{
    var rows = await connection.QueryAsync("""
        SELECT r.status,r.command,r.wait_type,r.total_elapsed_time,r.logical_reads,r.cpu_time,LEFT(t.text,200) AS consulta
        FROM sys.dm_exec_requests r JOIN sys.dm_exec_sessions s ON s.session_id=r.session_id
        CROSS APPLY sys.dm_exec_sql_text(r.sql_handle) t
        WHERE s.program_name=N'SNIER.Permisos.ReadOnly';
        """);
    Console.WriteLine(JsonSerializer.Serialize(rows));
}
