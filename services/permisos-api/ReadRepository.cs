using System.Globalization;
using System.Text.Json;
using Dapper;
using Microsoft.Data.SqlClient;
using Microsoft.Extensions.Caching.Memory;

namespace Permisos.Api;

public sealed record PageResult(long Total, int Page, int PageSize, int? NextPage, IReadOnlyList<Dictionary<string, object?>> Data);

public sealed class ReadRepository(IConfiguration configuration, Catalog catalog, IMemoryCache memory)
{
    private static readonly SemaphoreSlim[] CountLocks = Enumerable.Range(0, 16).Select(_ => new SemaphoreSlim(1, 1)).ToArray();
    private string Connection => configuration.GetConnectionString("ReadOnly")
        ?? throw new InvalidOperationException("Falta la conexión de lectura.");

    private string Base(Source s, bool includeData = false)
    {
        string F(string column, string fallback = "CAST(NULL AS nvarchar(max))") => catalog.Field(s, column, fallback);
        static string Clean(string value) => $"TRIM(NCHAR(9)+NCHAR(10)+NCHAR(13)+N' ' FROM {value})";
        var authority = s.Authority;
        var market = s.FixedMarket is null ? F("Mercado") : "N'" + s.FixedMarket + "'";
        var sourceStatus = s.IsWell ? F("Estatus_pozo") : F("Estatus");
        var status = s.IsWell ? "CAST(NULL AS nvarchar(50))" : s.LegacyStatus
            ? $"CASE WHEN LTRIM(RTRIM({sourceStatus})) COLLATE Latin1_General_CI_AI IN (N'Vigente', N'Operando', N'En construcción', N'Por iniciar operaciones', N'Por iniciar obras') THEN N'Vigente' ELSE N'No vigente' END"
            : sourceStatus;
        var norm = s.Normalized is not null ? F(s.Normalized) : $"UPPER({Clean("t.[" + s.Number + "]")})";
        var lat = F("Latitud_GEO"); var lon = F("Longitud_GEO");
        return $"""
            SELECT N'{s.Key}' AS tabla, N'{authority}' AS autoridad,
                CONVERT(nvarchar(100),{F("Id", "t.[" + s.Number + "]")}) AS id,
                {Clean("t.[" + s.Number + "]")} AS numero, {Clean(norm)} AS numeroNorm,
                {F("Razón_social")} AS razonSocial, {market} AS mercado, {F("Mercados_autorizados")} AS mercadosAutorizados,
                {status} AS estatus, {sourceStatus} AS estatusFuente,
                LTRIM(RTRIM(COALESCE(e.EF_ID,N'--'))) AS efId, COALESCE(e.EF_Nombre,N'Sin entidad') AS entidad,
                LTRIM(RTRIM(m.MunicipioID)) AS mpoId, m.Municipio_Nombre AS municipio,
                {lat} AS latitud, {lon} AS longitud,
                CONVERT(bit, CASE WHEN {lat} BETWEEN 10 AND 36 AND {lon} BETWEEN -121 AND -82 THEN 1 ELSE 0 END) AS coordenadasValidas,
                {F("Tipo_permiso", F("Tipo_asignacion", F("Tipo_pozo", F("Modalidad"))))} AS tipo,
                {F("Fuente", "N'CNE · Registro público de permisos'")} AS fuente,
                {F("Fuente_URL")} AS fuenteUrl,
                {F("Ley_aplicable")} AS leyAplicable, {F("Fecha_corte", "CAST(NULL AS date)")} AS fechaCorte,
                {F("FechaActualizacion", "CAST(NULL AS datetime2)")} AS fechaActualizacion,
                CAST(NULL AS nvarchar(2000)) AS ligaPermiso,
                CAST(NULL AS nvarchar(2000)) AS ligaResolucion,
                {(includeData ? "(SELECT " + catalog.JsonProjection(s) + " FOR JSON PATH,WITHOUT_ARRAY_WRAPPER,INCLUDE_NULL_VALUES)" : "CAST(NULL AS nvarchar(max))")} AS datosJson
            FROM dbo.[{s.Table}] t
            LEFT JOIN dbo.Entidades_Federativas e ON e.EF_ID=t.EF_ID
            LEFT JOIN dbo.Municipios m ON m.EF_ID=t.EF_ID AND m.MunicipioID=t.MPO_ID
            """;
    }

    private string RawWhere(Source s, Filters f, bool territory = false)
    {
        string F(string c) => catalog.Field(s, c, "NULL");
        var conditions = new List<string> { "1=1" };
        var number = $"TRIM(NCHAR(9)+NCHAR(10)+NCHAR(13)+N' ' FROM t.[{s.Number}])";
        var normalized = s.Normalized is null ? number : F(s.Normalized);
        if (f.Market is not null)
        {
            var market = s.FixedMarket is null ? F("Mercado") : "N'" + s.FixedMarket + "'";
            conditions.Add($"({market}=@Mercado OR ({market}=N'Varios' AND N';'+{F("Mercados_autorizados")}+N';' LIKE N'%;'+@Mercado+N';%'))");
        }
        if (f.Status is not null)
            conditions.Add(s.IsWell ? "1=0" : s.LegacyStatus
                ? $"(CASE WHEN LTRIM(RTRIM(t.Estatus)) COLLATE Latin1_General_CI_AI IN (N'Vigente',N'Operando',N'En construcción',N'Por iniciar operaciones',N'Por iniciar obras') THEN N'Vigente' ELSE N'No vigente' END)=@Estatus"
                : "t.Estatus=@Estatus");
        if (f.Type is not null)
        {
            var field = new[] { "Tipo_permiso", "Tipo_asignacion", "Tipo_pozo", "Modalidad" }.FirstOrDefault(c => catalog.Has(s, c));
            conditions.Add(field is null ? "1=0" : F(field) + "=@Tipo");
        }
        if (f.Number is not null) conditions.Add($"({number}=@Numero OR {normalized}=@Numero OR {normalized}=@NumeroNorm)");
        if (f.Query is not null) conditions.Add($"({number} COLLATE Latin1_General_100_CI_AI LIKE @Search ESCAPE N'~' OR {normalized} COLLATE Latin1_General_100_CI_AI LIKE @Search ESCAPE N'~' OR {F("Razón_social")} COLLATE Latin1_General_100_CI_AI LIKE @Search ESCAPE N'~')");
        if (territory)
        {
            if (f.Ef is not null) conditions.Add(f.Ef == "--" ? "e.EF_ID IS NULL" : "e.EF_ID=@Ef");
            if (f.Mpo is not null) conditions.Add("m.MunicipioID=@Mpo");
        }
        else if (f.Ef is not null)
        {
            if (s.Key == "asignaciones")
                conditions.Add(f.Ef == "--"
                    ? "NOT EXISTS(SELECT 1 FROM dbo.Asignaciones_SENER_Municipios am WHERE am.NumeroAsignacion=t.NumeroAsignacion)"
                    : "EXISTS(SELECT 1 FROM dbo.Asignaciones_SENER_Municipios am WHERE am.NumeroAsignacion=t.NumeroAsignacion AND am.EF_ID=@Ef" + (f.Mpo is null ? "" : " AND am.MPO_ID=@Mpo") + ")");
            else
            {
                conditions.Add(f.Ef == "--" ? "NOT EXISTS(SELECT 1 FROM dbo.Entidades_Federativas e WHERE e.EF_ID=t.EF_ID)" : "t.EF_ID=@Ef");
                if (f.Mpo is not null) conditions.Add("t.MPO_ID=@Mpo");
            }
        }
        return string.Join(" AND ", conditions);
    }

    private string PageSource(Source s, Filters f, string mode, bool light)
    {
        var number = $"TRIM(NCHAR(9)+NCHAR(10)+NCHAR(13)+N' ' FROM t.[{s.Number}])";
        var id = catalog.Has(s, "Id") ? "t.Id" : $"t.[{s.Number}]";
        var columns = $"N'{s.Key}' AS tabla,{number} AS numero,CONVERT(nvarchar(100),{id}) AS id";
        if (light)
        {
            var status = s.IsWell ? "CAST(NULL AS nvarchar(50))" : s.LegacyStatus
                ? "CASE WHEN LTRIM(RTRIM(t.Estatus)) COLLATE Latin1_General_CI_AI IN(N'Vigente',N'Operando',N'En construcción',N'Por iniciar operaciones',N'Por iniciar obras') THEN N'Vigente' ELSE N'No vigente' END" : "t.Estatus";
            var type = new[] { "Tipo_permiso", "Tipo_asignacion", "Tipo_pozo", "Modalidad" }.FirstOrDefault(c => catalog.Has(s, c));
            columns += $",t.[Razón_social] AS razonSocial,{status} AS estatus,{(s.IsWell ? "t.Estatus_pozo" : "t.Estatus")} AS estatusFuente,t.Latitud_GEO AS latitud,t.Longitud_GEO AS longitud,N'{s.Authority}' AS autoridad,{(type is null ? "CAST(NULL AS nvarchar(300))" : "t.["+type+"]")} AS tipo";
        }
        var valid = "(t.Latitud_GEO BETWEEN 10 AND 36 AND t.Longitud_GEO BETWEEN -121 AND -82)";
        var coordinates = mode == "puntos" ? " AND " + valid : mode == "sin-ubicacion" ? " AND (t.Latitud_GEO IS NULL OR t.Longitud_GEO IS NULL OR NOT " + valid + ")" : "";
        return $"SELECT {columns} FROM dbo.[{s.Table}] t WHERE {RawWhere(s,f)}{coordinates}";
    }

    private static object Parameters(Filters f) => new
    {
        Mercado = f.Market, Estatus = f.Status, Ef = f.Ef, Mpo = f.Mpo, Tipo = f.Type,
        Numero = f.Number, NumeroNorm = NormalizeNumber(f.Number), Offset = (f.Page - 1) * f.PageSize, Limit = f.PageSize
        , Search = SearchPattern(f.Query)
    };

    private static string? SearchPattern(string? value) => value is null ? null : "%" + value.Replace("~", "~~").Replace("%", "~%").Replace("_", "~_").Replace("[", "~[") + "%";

    public static string? NormalizeNumber(string? value)
    {
        if (value is null) return null;
        var text = string.Concat(value.ToUpperInvariant().Where(c => !char.IsWhiteSpace(c)));
        if (text.StartsWith("CNE/", StringComparison.Ordinal)) text = text[4..];
        return string.Join('/', text.Split('/').Select(segment => segment.All(char.IsAsciiDigit) && segment.Length > 0 ? segment.TrimStart('0') is "" ? "0" : segment.TrimStart('0') : segment));
    }

    public async Task<PageResult> ListAsync(Source[] sources, Filters f, string mode, CancellationToken ct)
    {
        if (sources.Length == 0) return new PageResult(0, f.Page, f.PageSize, null, []);
        var light = mode == "puntos" && f.Light;
        var cte = "WITH B AS (" + string.Join(" UNION ALL ",sources.Select(s => PageSource(s,f,mode,light))) + ")";
        var result = await PageAsync(cte, "SELECT * FROM B", "tabla,numero,id", Parameters(f), f, ct);
        if (!light)
        {
            await AttachDataAsync(sources, result.Data, ct);
            await AttachLinksAsync(result.Data, ct);
        }
        else foreach (var row in result.Data) row.Remove("id");
        return result;
    }

    // Materializar las columnas extensas después de paginar; nunca durante COUNT, UNION u ordenación.
    private async Task AttachDataAsync(Source[] sources, IReadOnlyList<Dictionary<string, object?>> rows, CancellationToken ct)
    {
        await using var connection = new SqlConnection(Connection);
        foreach (var source in sources)
        {
            var page = rows.Where(r => (string?)r["tabla"] == source.Key).ToArray();
            if (page.Length == 0) continue;
            var hasId = catalog.Has(source, "Id");
            var match = hasId ? "CONVERT(nvarchar(100),t.Id)" : $"t.[{source.Number}]";
            var predicate = hasId ? "t.Id IN @Ids" : $"{match} IN @Keys";
            var keys = page.Select(r => (string)r["id"]!).Distinct().ToArray();
            var records = await connection.QueryAsync(new CommandDefinition(Base(source,true) + $" WHERE {predicate};",
                new { Keys = keys, Ids = hasId ? keys.Select(int.Parse).ToArray() : [] }, commandTimeout: 30, cancellationToken: ct));
            var byKey = records.Select(r => ConvertRow((IDictionary<string,object>)r)).GroupBy(r => (string)r["id"]!)
                .ToDictionary(g => g.Key, g => g.First(), StringComparer.OrdinalIgnoreCase);
            foreach (var row in page)
                if (byKey.TryGetValue((string)row["id"]!, out var full))
                {
                    row.Clear();
                    foreach (var field in full) row[field.Key] = field.Value;
                }
        }
    }

    // Buscar ligas sólo para la página, evitando una consulta correlacionada por cada fila del inventario.
    private async Task AttachLinksAsync(IReadOnlyList<Dictionary<string, object?>> rows, CancellationToken ct)
    {
        var cne = rows.Where(r => (string?)r["autoridad"] == "CNE").ToArray();
        if (cne.Length == 0) return;
        var numbers = cne.Select(r => (string)r["numero"]!).Distinct().ToArray();
        var normalized = numbers.Select(NormalizeNumber).Distinct().ToArray();
        await using var connection = new SqlConnection(Connection);
        var links = (await connection.QueryAsync(new CommandDefinition("""
            SELECT NumeroPermiso,NumeroPermisoNorm,LigaPermiso,LigaResolucionOtorgamiento
            FROM dbo.Ligas_Permisos_CNE WHERE NumeroPermiso IN @Numbers OR NumeroPermisoNorm IN @Normalized
            ORDER BY FechaActualizacion DESC,Id DESC;
            """, new { Numbers = numbers, Normalized = normalized }, commandTimeout: 30, cancellationToken: ct)))
            .Select(r => (IDictionary<string, object>)r).ToArray();
        foreach (var row in cne)
        {
            var number = (string)row["numero"]!;
            row["numeroNorm"] = NormalizeNumber((string?)row["numeroNorm"]);
            var link = links.FirstOrDefault(l => string.Equals((string?)l["NumeroPermiso"], number, StringComparison.OrdinalIgnoreCase)
                || string.Equals((string?)l["NumeroPermisoNorm"], NormalizeNumber(number), StringComparison.OrdinalIgnoreCase));
            if (link is null) continue;
            row["ligaPermiso"] = link["LigaPermiso"];
            row["ligaResolucion"] = link["LigaResolucionOtorgamiento"];
            row["fuenteUrl"] = link["LigaPermiso"];
        }
    }

    public Task<PageResult> TerritoriesAsync(Source[] sources, Filters f, bool municipalities, CancellationToken ct)
    {
        if (sources.Length == 0) return Task.FromResult(new PageResult(0, f.Page, f.PageSize, null, []));
        var branches = sources.Select(s =>
        {
            var assignment = s.Key == "asignaciones";
            var location = assignment ? "am" : "t";
            var daughter = assignment ? " LEFT JOIN dbo.Asignaciones_SENER_Municipios am ON am.NumeroAsignacion=t.NumeroAsignacion " : "";
            var townJoin = municipalities || f.Mpo is not null ? $" LEFT JOIN dbo.Municipios m ON m.EF_ID={location}.EF_ID AND m.MunicipioID={location}.MPO_ID " : "";
            var groups = "e.EF_ID,e.EF_Nombre" + (municipalities ? ",m.MunicipioID,m.Municipio_Nombre" : "");
            var count = assignment ? "COUNT_BIG(DISTINCT t.NumeroAsignacion)" : "COUNT_BIG(*)";
            return $"SELECT e.EF_ID AS efId,e.EF_Nombre AS entidad" +
                (municipalities ? ",m.MunicipioID AS mpoId,m.Municipio_Nombre AS municipio" : "") +
                $",{count} AS permisos FROM dbo.[{s.Table}] t {daughter} LEFT JOIN dbo.Entidades_Federativas e ON e.EF_ID={location}.EF_ID {townJoin}" +
                $" WHERE {RawWhere(s,f,territory:true)} GROUP BY {groups}";
        });
        var cte = "WITH G AS (" + string.Join(" UNION ALL ",branches) + ")";
        var columns = "COALESCE(RTRIM(efId),N'--') AS efId,COALESCE(entidad,N'Sin entidad') AS entidad" +
            (municipalities ? ",RTRIM(mpoId) AS mpoId,municipio" : "");
        var grouping = "efId,entidad" + (municipalities ? ",mpoId,municipio" : "");
        return PageAsync(cte, $"SELECT {columns},SUM(permisos) AS permisos FROM G GROUP BY {grouping}",
            municipalities ? "efId,mpoId" : "efId", Parameters(f), f, ct);
    }

    public async Task<Dictionary<string, object?>?> DetailAsync(Source[] sources, Filters f, CancellationToken ct)
    {
        var result = await ListAsync(sources, f with { Page = 1, PageSize = 2 }, "lista", ct);
        return result.Data.FirstOrDefault();
    }

    public Task<PageResult> AssignmentMunicipalitiesAsync(Filters f, CancellationToken ct) => PageAsync("", """
        SELECT am.Id AS id,am.NumeroAsignacion AS numeroAsignacion,LTRIM(RTRIM(am.EF_ID)) AS efId,
               COALESCE(e.EF_Nombre,N'Sin entidad') AS entidad,LTRIM(RTRIM(am.MPO_ID)) AS mpoId,m.Municipio_Nombre AS municipio,
               am.Municipio_fuente AS municipioFuente,am.Origen_relacion AS origenRelacion,am.Nota AS nota,
               am.Fuente_URL AS fuenteUrl,am.Fecha_corte AS fechaCorte,am.FechaActualizacion AS fechaActualizacion
        FROM dbo.Asignaciones_SENER_Municipios am
        JOIN dbo.Asignaciones_SENER a ON a.NumeroAsignacion=am.NumeroAsignacion
        LEFT JOIN dbo.Entidades_Federativas e ON e.EF_ID=am.EF_ID
        LEFT JOIN dbo.Municipios m ON m.EF_ID=am.EF_ID AND m.MunicipioID=am.MPO_ID
        WHERE (@Numero IS NULL OR a.NumeroAsignacion=@Numero OR a.NumeroAsignacionNorm=@Numero)
          AND (@Estatus IS NULL OR a.Estatus=@Estatus) AND (@Ef IS NULL OR am.EF_ID=@Ef) AND (@Mpo IS NULL OR am.MPO_ID=@Mpo)
          AND (@Tipo IS NULL OR a.Tipo_asignacion=@Tipo)
          AND (@Search IS NULL OR a.NumeroAsignacion COLLATE Latin1_General_100_CI_AI LIKE @Search ESCAPE N'~'
               OR a.[Razón_social] COLLATE Latin1_General_100_CI_AI LIKE @Search ESCAPE N'~')
          AND (@Mercado IS NULL OR a.Mercado=@Mercado OR (a.Mercado=N'Varios' AND N';'+a.Mercados_autorizados+N';' LIKE N'%;'+@Mercado+N';%'))
        """, "numeroAsignacion,efId,mpoId,id", Parameters(f), f, ct);

    public Task<PageResult> LinksAsync(Filters f, CancellationToken ct) => PageAsync("", """
        SELECT Id AS id,NumeroPermiso AS numeroPermiso,NumeroPermisoNorm AS numeroPermisoNorm,Mercado AS mercado,
               LigaPermiso AS ligaPermiso,LigaResolucionOtorgamiento AS ligaResolucion,
               LigasResoluciones AS ligasResoluciones,NumerosResolucion AS numerosResolucion,FechaActualizacion AS fechaActualizacion
        FROM dbo.Ligas_Permisos_CNE
        WHERE (@Numero IS NULL OR NumeroPermiso=@Numero OR NumeroPermisoNorm=@Numero OR NumeroPermisoNorm=@NumeroNorm)
          AND (@Mercado IS NULL OR Mercado=@Mercado)
          AND (@Search IS NULL OR NumeroPermiso COLLATE Latin1_General_100_CI_AI LIKE @Search ESCAPE N'~'
               OR NumeroPermisoNorm COLLATE Latin1_General_100_CI_AI LIKE @Search ESCAPE N'~')
        """, "numeroPermisoNorm,id", Parameters(f), f, ct);

    public async Task<PageResult> UpdatesAsync(Source[] sources, Filters f, bool includeLinks, CancellationToken ct)
    {
        var permitted = sources.Select(s => s.Table).ToList();
        if (includeLinks && (f.Table is null or "ligas") && (f.Authority is null or "CNE")) permitted.Add("Ligas_Permisos_CNE");
        if (sources.Any(s => s.Key == "asignaciones") && f.Table is null) permitted.Add("Asignaciones_SENER_Municipios");
        const string cte = """
            WITH C AS (
             SELECT N'CNE' AS autoridad,Id,Tabla,FechaActualizacion,FechaCorteFuente,Filas,Fuente FROM dbo.Control_Actualizacion_CNE
             UNION ALL
             SELECT N'SENER',Id,Tabla,FechaActualizacion,FechaCorteFuente,Filas,Fuente FROM dbo.Control_Actualizacion_SENER
            ), R AS (SELECT *,ROW_NUMBER() OVER(PARTITION BY autoridad,Tabla ORDER BY FechaActualizacion DESC,Id DESC) AS rn FROM C)
            """;
        var result = await PageAsync(cte, "SELECT autoridad,Tabla AS tabla,FechaActualizacion AS fechaActualizacion,FechaCorteFuente AS fechaCorteFuente,Filas AS filas,Fuente AS fuente FROM R WHERE rn=1 AND Tabla IN @Tables",
            "autoridad,tabla", new { Tables = permitted, Offset = (f.Page - 1) * f.PageSize, Limit = f.PageSize }, f, ct);
        foreach (var row in result.Data)
        {
            var physical = (string)row["tabla"]!;
            // Aditivo: conservar tabla física para consumidores existentes.
            row["clave"] = Catalog.Sources.FirstOrDefault(s => s.Table == physical)?.Key ?? physical switch
            {
                "Ligas_Permisos_CNE" => "ligas",
                "Asignaciones_SENER_Municipios" => "asignaciones-municipios",
                _ => null
            };
        }
        return result;
    }

    private async Task<PageResult> PageAsync(string cte, string select, string order, object parameters, Filters f, CancellationToken ct)
    {
        await using var connection = new SqlConnection(Connection);
        var countParameters = JsonSerializer.SerializeToElement(parameters).EnumerateObject()
            .Where(p => p.Name is not ("Offset" or "Limit")).ToDictionary(p => p.Name, p => p.Value);
        var countKey = cte + select + JsonSerializer.Serialize(countParameters);
        if (!memory.TryGetValue<long>(countKey, out var total))
        {
            var gate = CountLocks[(StringComparer.Ordinal.GetHashCode(countKey) & int.MaxValue) % CountLocks.Length];
            await gate.WaitAsync(ct);
            try
            {
                if (!memory.TryGetValue(countKey, out total))
                {
                    total = await connection.ExecuteScalarAsync<long>(new CommandDefinition(
                        $"{cte} SELECT COUNT_BIG(*) FROM ({select}) Q OPTION(RECOMPILE);", parameters, commandTimeout: 45, cancellationToken: ct));
                    memory.Set(countKey, total, new MemoryCacheEntryOptions().SetAbsoluteExpiration(TimeSpan.FromSeconds(30)).SetSize(1));
                }
            }
            finally { gate.Release(); }
        }
        var data = await connection.QueryAsync(new CommandDefinition(
            $"{cte} {select} ORDER BY {order} OFFSET @Offset ROWS FETCH NEXT @Limit ROWS ONLY OPTION(RECOMPILE);", parameters, commandTimeout: 45, cancellationToken: ct));
        var rows = data.Select(row => ConvertRow((IDictionary<string, object>)row)).ToList();
        return new(total, f.Page, f.PageSize, (long)f.Page * f.PageSize < total ? f.Page + 1 : null, rows);
    }

    private static Dictionary<string, object?> ConvertRow(IDictionary<string, object> row)
    {
        var result = new Dictionary<string, object?>();
        foreach (var (key, value) in row)
        {
            if (key == "datosJson") { if (value is string json) result["datos"] = JsonSerializer.Deserialize<JsonElement>(json); continue; }
            result[key] = value switch
            {
                null or DBNull => null,
                DateTime dt when key == "fechaActualizacion" => DateTime.SpecifyKind(dt, DateTimeKind.Utc).ToString("O", CultureInfo.InvariantCulture),
                DateTime dt => dt.ToString("yyyy-MM-dd", CultureInfo.InvariantCulture),
                _ => value
            };
        }
        return result;
    }

    public async Task<bool> ReadyAsync(CancellationToken ct)
    {
        await using var connection = new SqlConnection(Connection);
        return await connection.ExecuteScalarAsync<int>(new CommandDefinition("SELECT TOP 1 1 FROM dbo.Control_Actualizacion_CNE", commandTimeout: 10, cancellationToken: ct)) == 1;
    }
}
