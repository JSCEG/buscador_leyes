using System.Globalization;
using System.Text;
using System.Text.Json;

namespace Permisos.Api;

public sealed record Source(string Key, string Table, string Authority, string Number, string? Normalized,
    string? FixedMarket = null, bool LegacyStatus = false)
{
    public bool IsWell => Key == "pozos";
}

public sealed record Column(string tabla, string columna, string tipo);

public sealed class Catalog
{
    public static readonly Source[] Sources =
    [
        new("electricidad", "Electricidad_autorizado", "CNE", "NumeroPermiso", null, "Electricidad"),
        new("petroliferos", "Expendios_autorizado", "CNE", "NumeroPermiso", null, "Petrolíferos", true),
        new("gas-lp", "GasLP_autorizado", "CNE", "NumeroPermiso", null, "Gas LP", true),
        new("gas-natural", "GasNatural_autorizado", "CNE", "NumeroPermiso", null, "Gas natural"),
        new("transporte", "Transporte_autorizado", "CNE", "NumeroPermiso", "NumeroPermisoNorm"),
        new("comercializacion", "Comercializacion_autorizado", "CNE", "NumeroPermiso", "NumeroPermisoNorm"),
        new("infraestructura", "Infraestructura_Hidrocarburos_autorizado", "CNE", "NumeroPermiso", "NumeroPermisoNorm"),
        new("suministro", "Suministro_Electrico_autorizado", "CNE", "NumeroPermiso", "NumeroPermisoNorm"),
        new("terceros", "Terceros_Acreditados_CNE", "CNE", "NumeroPermiso", "NumeroPermisoNorm"),
        new("asignaciones", "Asignaciones_SENER", "SENER", "NumeroAsignacion", "NumeroAsignacionNorm"),
        new("comercio-exterior", "ComercioExterior_SENER_autorizado", "SENER", "NumeroPermiso", "NumeroPermisoNorm"),
        new("contratos-ee", "Contratos_EE_SENER", "SENER", "NumeroContrato", "NumeroContratoNorm"),
        new("pozos", "Pozos_SENER", "SENER", "NombrePozo", "NombrePozoNorm"),
        new("biocombustibles", "Biocombustibles_SENER_autorizado", "SENER", "NumeroPermiso", "NumeroPermisoNorm")
    ];
    private readonly Column[] _columns;
    public Catalog(IWebHostEnvironment environment)
    {
        _columns = JsonSerializer.Deserialize<Column[]>(File.ReadAllText(Path.Combine(environment.ContentRootPath, "schema.json")))!;
    }
    public IEnumerable<Column> Columns(string table) => _columns.Where(c => c.tabla == table);
    public bool Has(Source source, string column) => Columns(source.Table).Any(c => c.columna.Equals(column, StringComparison.OrdinalIgnoreCase));
    public string Field(Source source, string column, string fallback = "NULL") => Has(source, column) ? "t." + Quote(column) : fallback;
    public static string Quote(string name) => "[" + name.Replace("]", "]]") + "]";
    public static string JsonName(string column)
    {
        if (column.Equals("EF_ID", StringComparison.OrdinalIgnoreCase)) return "efId";
        if (column.Equals("MPO_ID", StringComparison.OrdinalIgnoreCase)) return "mpoId";
        if (column == "RFC") return "rfc";
        var plain = new string(column.Normalize(NormalizationForm.FormD).Where(c => CharUnicodeInfo.GetUnicodeCategory(c) != UnicodeCategory.NonSpacingMark).ToArray());
        var words = plain.Split('_', StringSplitOptions.RemoveEmptyEntries);
        var joined = words[0] + string.Concat(words.Skip(1).Select(w => char.ToUpperInvariant(w[0]) + w[1..]));
        return char.ToLowerInvariant(joined[0]) + joined[1..];
    }
    public string JsonProjection(Source source) => string.Join(", ", Columns(source.Table).Select(c =>
        (c.tipo == "datetime2" ? $"CONVERT(varchar(33),t.{Quote(c.columna)},126)+'Z'" : "t." + Quote(c.columna)) + " AS " + Quote(JsonName(c.columna))));
}
