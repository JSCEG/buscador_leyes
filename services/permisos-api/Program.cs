using System.Threading.RateLimiting;
using Microsoft.AspNetCore.Authentication;
using Microsoft.AspNetCore.RateLimiting;
using Permisos.Api;

var builder = WebApplication.CreateBuilder(args);
builder.Services.AddSingleton<Catalog>();
builder.Services.AddMemoryCache(options => options.SizeLimit = 256);
builder.Services.AddScoped<ReadRepository>();
builder.Services.AddAuthentication("ApiKey").AddScheme<AuthenticationSchemeOptions, ApiKeyAuthentication>("ApiKey", _ => { });
string[] scopes = ["mapa:read", "tablas:read", "detalle:read", "documentos:read", "actualizaciones:read"];
builder.Services.AddAuthorization(options =>
{
    foreach (var scope in scopes) options.AddPolicy(scope, p => p.RequireAuthenticatedUser().RequireClaim("scope", scope));
    options.FallbackPolicy = new Microsoft.AspNetCore.Authorization.AuthorizationPolicyBuilder().RequireAuthenticatedUser().Build();
});
builder.Services.AddCors(options => options.AddDefaultPolicy(policy => policy
    .WithOrigins("https://buscador-juridico.com").WithMethods("GET").WithHeaders("X-Api-Key", "Content-Type")));
builder.Services.AddRateLimiter(options =>
{
    options.RejectionStatusCode = 429;
    options.GlobalLimiter = PartitionedRateLimiter.Create<HttpContext, string>(context =>
        RateLimitPartition.GetFixedWindowLimiter(context.User.FindFirst(System.Security.Claims.ClaimTypes.NameIdentifier)?.Value
            ?? context.Connection.RemoteIpAddress?.ToString() ?? "anonymous", _ => new FixedWindowRateLimiterOptions
            { PermitLimit = context.User.Identity?.IsAuthenticated == true && int.TryParse(context.User.FindFirst("requests_per_minute")?.Value, out var configuredLimit) ? configuredLimit : 60, Window = TimeSpan.FromMinutes(1), QueueLimit = 0 }));
    options.OnRejected = async (context, ct) =>
    {
        context.HttpContext.Response.Headers.RetryAfter = "60";
        await context.HttpContext.Response.WriteAsJsonAsync(new { error = "Límite de consultas por minuto alcanzado." }, ct);
    };
});
var app = builder.Build();
app.UseCors();
app.Use(async (context, next) =>
{
    context.Response.Headers.CacheControl = "no-store";
    context.Response.Headers.XContentTypeOptions = "nosniff";
    try { await next(context); }
    catch (InvalidQuery ex) { context.Response.StatusCode = 400; await context.Response.WriteAsJsonAsync(new { error = ex.Message }); }
    catch (UnauthorizedAccessException) { context.Response.StatusCode = 403; await context.Response.WriteAsJsonAsync(new { error = "Tabla no autorizada para este cliente." }); }
    catch (OperationCanceledException) when (context.RequestAborted.IsCancellationRequested) { }
    catch (Exception ex)
    {
        app.Logger.LogError(ex, "Falló una consulta de permisos. TraceId {TraceId}", context.TraceIdentifier);
        context.Response.StatusCode = 500;
        await context.Response.WriteAsJsonAsync(new { error = "No fue posible consultar la fuente de permisos.", traceId = context.TraceIdentifier });
    }
});
app.UseAuthentication();
app.UseRateLimiter();
app.UseAuthorization();

app.MapGet("/health/live", () => Results.Ok(new { status = "ok" })).AllowAnonymous();
app.MapGet("/health/ready", async (ReadRepository repository, CancellationToken ct) =>
    await repository.ReadyAsync(ct) ? Results.Ok(new { status = "ok" }) : Results.StatusCode(503)).RequireAuthorization("tablas:read");

var api = app.MapGroup("/api/v1");
api.MapGet("/catalogo", (HttpContext context) => Results.Ok(new
{
    tablas = Catalog.Sources.Where(s => context.User.HasClaim("dataset", s.Key))
        .Select(s => new { clave = s.Key, tabla = "dbo." + s.Table, autoridad = s.Authority, tieneVigencia = !s.IsWell })
        .Concat(context.User.HasClaim("dataset", "ligas") ? [new { clave = "ligas", tabla = "dbo.Ligas_Permisos_CNE", autoridad = "CNE", tieneVigencia = false }] : []),
    mercados = Filters.Markets,
    pageSizeMaximo = 500
})).RequireAuthorization("tablas:read");

foreach (var mode in new[] { "permisos", "puntos", "sin-ubicacion" })
{
    var selectedMode = mode;
    api.MapGet("/" + mode, async (HttpContext context, ReadRepository repository, CancellationToken ct) =>
    {
        var f = Filters.Parse(context);
        if (f.Table == "ligas") throw new InvalidQuery("Usa /ligas para consultar documentos.");
        return Results.Ok(await repository.ListAsync(f.SelectSources(context.User), f, selectedMode, ct));
    }).RequireAuthorization(mode == "puntos" ? "mapa:read" : "tablas:read");
}
foreach (var mode in new[] { "estados", "municipios" })
{
    var municipalities = mode == "municipios";
    api.MapGet("/" + mode, async (HttpContext context, ReadRepository repository, CancellationToken ct) =>
    {
        var f = Filters.Parse(context);
        if (f.Table == "ligas") throw new InvalidQuery("La tabla de ligas no tiene ubicación.");
        return Results.Ok(await repository.TerritoriesAsync(f.SelectSources(context.User), f, municipalities, ct));
    }).RequireAuthorization("mapa:read");
}
api.MapGet("/detalle", async (HttpContext context, ReadRepository repository, CancellationToken ct) =>
{
    var f = Filters.Parse(context, requireNumber: true);
    if (f.Table == "ligas") throw new InvalidQuery("Usa /ligas para consultar documentos.");
    var detail = await repository.DetailAsync(f.SelectSources(context.User), f, ct);
    return detail is null ? Results.NotFound(new { error = "Permiso o título no encontrado." }) : Results.Ok(detail);
}).RequireAuthorization("detalle:read");

api.MapGet("/ligas", async (HttpContext context, ReadRepository repository, CancellationToken ct) =>
{
    var f = Filters.Parse(context);
    if (!context.User.HasClaim("dataset", "ligas")) throw new UnauthorizedAccessException();
    if (f.Authority is "SENER" || f.Table is not (null or "ligas") || f.Ef is not null || f.Mpo is not null || f.Status is not null || f.Type is not null)
        throw new InvalidQuery("Ligas admite numero, mercado y paginación; autoridad CNE y tabla ligas son opcionales.");
    return Results.Ok(await repository.LinksAsync(f, ct));
}).RequireAuthorization("documentos:read");

api.MapGet("/asignaciones/municipios", async (HttpContext context, ReadRepository repository, CancellationToken ct) =>
{
    var f = Filters.Parse(context);
    if (!context.User.HasClaim("dataset", "asignaciones")) throw new UnauthorizedAccessException();
    if (f.Table is not (null or "asignaciones") || f.Authority is "CNE") throw new InvalidQuery("Sólo aplica a asignaciones SENER.");
    return Results.Ok(await repository.AssignmentMunicipalitiesAsync(f, ct));
}).RequireAuthorization("tablas:read");

api.MapGet("/actualizaciones", async (HttpContext context, ReadRepository repository, CancellationToken ct) =>
{
    var f = Filters.Parse(context);
    if (f.Status is not null || f.Market is not null || f.Ef is not null || f.Mpo is not null || f.Type is not null || f.Number is not null || f.Query is not null || f.Light)
        throw new InvalidQuery("Actualizaciones admite tabla, autoridad y paginación.");
    var sources = f.SelectSources(context.User);
    return Results.Ok(await repository.UpdatesAsync(sources, f, context.User.HasClaim("dataset", "ligas"), ct));
}).RequireAuthorization("actualizaciones:read");

app.Run();
