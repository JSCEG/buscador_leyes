param(
    [Parameter(Mandatory)][ValidatePattern('^[a-z][a-z0-9]{2,31}$')][string]$ClientId,
    [Parameter(Mandatory)][ValidateSet('mapa:read','tablas:read','detalle:read','documentos:read','actualizaciones:read')][string[]]$Scopes,
    [Parameter(Mandatory)][ValidateSet('electricidad','petroliferos','gas-lp','gas-natural','transporte','comercializacion','infraestructura','suministro','terceros','asignaciones','comercio-exterior','contratos-ee','pozos','biocombustibles','ligas')][string[]]$Datasets,
    [ValidateRange(1,10000)][int]$RequestsPerMinute = 600,
    [string]$AppName = 'snier-permisos-api',
    [string]$ResourceGroup = 'GrupoSnier'
)
$ErrorActionPreference = 'Stop'
$existing = az webapp config appsettings list --name $AppName --resource-group $ResourceGroup -o json | ConvertFrom-Json
if ($LASTEXITCODE -ne 0) { throw 'No se pudo leer App Settings.' }
$prefix = "ApiClients__${ClientId}__"
if ($existing | Where-Object { $_.name.StartsWith($prefix, [StringComparison]::OrdinalIgnoreCase) }) {
    throw 'El cliente ya existe. Usa otro identificador para rotar con solapamiento y luego deshabilita el anterior.'
}
$private = [IO.Path]::GetFullPath((Join-Path $PSScriptRoot '../.secrets'))
New-Item -ItemType Directory -Path $private -Force | Out-Null
$identity = [Security.Principal.WindowsIdentity]::GetCurrent().Name
icacls $private /inheritance:r /grant:r "${identity}:(OI)(CI)F" | Out-Null
if ($LASTEXITCODE -ne 0) { throw 'No se pudo proteger la carpeta de secretos.' }
$key = 'snier_' + [Convert]::ToBase64String([Security.Cryptography.RandomNumberGenerator]::GetBytes(40)).TrimEnd('=').Replace('+','-').Replace('/','_')
$hash = [Convert]::ToHexString([Security.Cryptography.SHA256]::HashData([Text.Encoding]::UTF8.GetBytes($key)))
$settings = @{ ($prefix+'Enabled') = 'true'; ($prefix+'KeyHash') = $hash }
$settings[$prefix+'RequestsPerMinute'] = [string]$RequestsPerMinute
for ($i=0; $i -lt $Scopes.Count; $i++) { $settings[$prefix+'Scopes__'+$i] = $Scopes[$i] }
for ($i=0; $i -lt $Datasets.Count; $i++) { $settings[$prefix+'Datasets__'+$i] = $Datasets[$i] }
$settingsFile = Join-Path $private "$ClientId.settings.json"
$keyFile = Join-Path $private "$ClientId.key"
$settings | ConvertTo-Json | Set-Content -LiteralPath $settingsFile -Encoding utf8
[IO.File]::WriteAllText($keyFile, $key)
try {
    az webapp config appsettings set --name $AppName --resource-group $ResourceGroup --settings "@$settingsFile" --only-show-errors -o none
    if ($LASTEXITCODE -ne 0) { throw 'No se pudo crear el cliente en Azure.' }
} finally { Remove-Item -LiteralPath $settingsFile -Force }
Write-Output "Cliente $ClientId creado. Clave disponible únicamente en: $keyFile"
Write-Output 'Entrega la clave por un canal privado y guárdala en el servidor consumidor, nunca en JavaScript público.'
