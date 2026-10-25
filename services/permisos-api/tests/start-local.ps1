param([string]$SettingsPath, [int]$Port = 5197)
$ErrorActionPreference = 'Stop'
$settings = Get-Content -LiteralPath $SettingsPath -Raw | ConvertFrom-Json -AsHashtable
foreach ($entry in $settings.GetEnumerator()) {
    [Environment]::SetEnvironmentVariable($entry.Key, [string]$entry.Value, 'Process')
}
$restrictedKey = 'snier_' + [Convert]::ToHexString([Security.Cryptography.RandomNumberGenerator]::GetBytes(32))
$restrictedHash = [Convert]::ToHexString([Security.Cryptography.SHA256]::HashData([Text.Encoding]::UTF8.GetBytes($restrictedKey)))
$env:ApiClients__test__KeyHash = $restrictedHash
$env:ApiClients__test__Enabled = 'true'
$env:ApiClients__test__Scopes__0 = 'mapa:read'
$env:ApiClients__test__Datasets__0 = 'electricidad'
$project = [IO.Path]::GetFullPath((Join-Path $PSScriptRoot '../Permisos.Api.csproj'))
[IO.File]::WriteAllText((Join-Path (Split-Path $SettingsPath) 'restricted-test.key'), $restrictedKey)
dotnet run --project $project -c Release --no-launch-profile -- --urls "http://127.0.0.1:$Port"
