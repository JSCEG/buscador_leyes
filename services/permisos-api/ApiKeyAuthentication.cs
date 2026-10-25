using System.Security.Claims;
using System.Security.Cryptography;
using System.Text;
using System.Text.Encodings.Web;
using Microsoft.AspNetCore.Authentication;
using Microsoft.Extensions.Options;

namespace Permisos.Api;

public sealed class ApiClient
{
    public string KeyHash { get; set; } = "";
    public bool Enabled { get; set; }
    public string[] Scopes { get; set; } = [];
    public string[] Datasets { get; set; } = [];
    public int RequestsPerMinute { get; set; } = 600;
}

public sealed class ApiKeyAuthentication(IOptionsMonitor<AuthenticationSchemeOptions> options,
    ILoggerFactory logger, UrlEncoder encoder, IConfiguration config)
    : AuthenticationHandler<AuthenticationSchemeOptions>(options, logger, encoder)
{
    protected override Task<AuthenticateResult> HandleAuthenticateAsync()
    {
        if (!Request.Headers.TryGetValue("X-Api-Key", out var values) || values.Count != 1)
            return Task.FromResult(AuthenticateResult.NoResult());
        var key = values[0];
        if (key is null || key.Length is < 32 or > 256) return Task.FromResult(AuthenticateResult.Fail("Clave inválida."));
        var hash = SHA256.HashData(Encoding.UTF8.GetBytes(key));
        foreach (var item in config.GetSection("ApiClients").GetChildren())
        {
            var client = item.Get<ApiClient>();
            if (client is null || !client.Enabled || client.KeyHash.Length != 64) continue;
            byte[] expected;
            try { expected = Convert.FromHexString(client.KeyHash); }
            catch (FormatException) { continue; }
            if (!CryptographicOperations.FixedTimeEquals(hash, expected)) continue;
            var claims = new List<Claim> { new(ClaimTypes.NameIdentifier, item.Key) };
            claims.Add(new Claim("requests_per_minute", Math.Clamp(client.RequestsPerMinute, 1, 10000).ToString(System.Globalization.CultureInfo.InvariantCulture)));
            claims.AddRange(client.Scopes.Select(s => new Claim("scope", s)));
            claims.AddRange(client.Datasets.Select(d => new Claim("dataset", d)));
            return Task.FromResult(AuthenticateResult.Success(new AuthenticationTicket(
                new ClaimsPrincipal(new ClaimsIdentity(claims, Scheme.Name)), Scheme.Name)));
        }
        return Task.FromResult(AuthenticateResult.Fail("Clave inválida."));
    }
    protected override Task HandleChallengeAsync(AuthenticationProperties properties)
    {
        Response.StatusCode = 401;
        Response.Headers.WWWAuthenticate = "ApiKey";
        return Response.WriteAsJsonAsync(new { error = "Se requiere una API key válida." });
    }
    protected override Task HandleForbiddenAsync(AuthenticationProperties properties)
    {
        Response.StatusCode = 403;
        return Response.WriteAsJsonAsync(new { error = "El cliente no tiene permiso para esta consulta." });
    }
}
