using System.Security.Claims;

namespace Permisos.Api;

public sealed class InvalidQuery(string message) : Exception(message);

public sealed record Filters(string? Table, string? Authority, string? Market, string? Status, string? Ef,
    string? Mpo, string? Type, string? Number, int Page, int PageSize, string? Query = null, bool Light = false)
{
    public static readonly string[] Markets = ["Petrolíferos", "Gas natural", "Gas LP", "Petróleo crudo", "Petroquímicos", "Electricidad", "Varios", "Biocombustibles"];
    public static Filters Parse(HttpContext context, bool requireNumber = false)
    {
        var query = context.Request.Query;
        var allowed = new[] { "tabla", "autoridad", "mercado", "estatus", "ef", "mpo", "tipo", "numero", "page", "pageSize", "q", "ligero" };
        if (query.Keys.Any(k => !allowed.Contains(k, StringComparer.Ordinal)) || query.Any(q => q.Value.Count != 1))
            throw new InvalidQuery("Parámetros desconocidos o repetidos.");
        string? Get(string key)
        {
            if (!query.ContainsKey(key)) return null;
            var value = query[key].ToString().Trim();
            if (string.IsNullOrWhiteSpace(value) || value.Length > 300 || value.Any(char.IsControl)) throw new InvalidQuery("Parámetro vacío o inválido: " + key);
            return value;
        }
        var table = Get("tabla"); var authority = Get("autoridad"); var market = Get("mercado");
        var status = Get("estatus"); var ef = Get("ef"); var mpo = Get("mpo"); var type = Get("tipo"); var number = Get("numero");
        var text = Get("q"); var light = Get("ligero");
        if (text is not null && text.Length is < 2 or > 120) throw new InvalidQuery("q debe tener entre 2 y 120 caracteres.");
        if (light is not null and not ("true" or "false")) throw new InvalidQuery("ligero debe ser true o false.");
        if (light is not null && context.Request.Path != "/api/v1/puntos") throw new InvalidQuery("ligero sólo aplica a /puntos.");
        if (table is not null && !Catalog.Sources.Any(s => s.Key == table) && table != "ligas") throw new InvalidQuery("Tabla desconocida.");
        if (authority is not null and not ("CNE" or "SENER")) throw new InvalidQuery("Autoridad inválida.");
        if (market is not null && !Markets.Contains(market)) throw new InvalidQuery("Mercado inválido.");
        if (status is not null and not ("Vigente" or "No vigente")) throw new InvalidQuery("Estatus inválido.");
        if (ef is not null && ef != "--" && (ef.Length != 2 || ef.Any(c => c < '0' || c > '9'))) throw new InvalidQuery("ef debe tener dos dígitos o --.");
        if (mpo is not null && (ef is null or "--" || mpo.Length != 3 || mpo.Any(c => c < '0' || c > '9'))) throw new InvalidQuery("mpo requiere ef y tres dígitos.");
        int Page(string key, int defaultValue, int max)
        {
            var raw = Get(key);
            if (raw is null) return defaultValue;
            if (!int.TryParse(raw, out var result) || result < 1 || result > max) throw new InvalidQuery("Paginación inválida.");
            return result;
        }
        if (requireNumber && (number is null || table is null)) throw new InvalidQuery("Se requieren tabla y numero.");
        return new(table, authority, market, status, ef, mpo, type, number, Page("page", 1, 100000), Page("pageSize", 100, 500), text, light == "true");
    }
    public Source[] SelectSources(ClaimsPrincipal user)
    {
        if (Table is not null && !user.HasClaim("dataset", Table)) throw new UnauthorizedAccessException();
        return Catalog.Sources.Where(s => user.HasClaim("dataset", s.Key) && (Table is null || s.Key == Table)
            && (Authority is null || s.Authority == Authority)).ToArray();
    }
}
