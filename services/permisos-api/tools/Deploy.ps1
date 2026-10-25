param([string]$AppName = 'snier-permisos-api', [string]$ResourceGroup = 'GrupoSnier')
$ErrorActionPreference = 'Stop'
$root = [IO.Path]::GetFullPath((Join-Path $PSScriptRoot '..'))
$stamp = [DateTime]::UtcNow.ToString('yyyyMMdd-HHmmss')
$out = Join-Path $root "out/$stamp"
$publish = Join-Path $out 'publish'
New-Item -ItemType Directory -Force -Path $publish | Out-Null
dotnet publish (Join-Path $root 'Permisos.Api.csproj') -c Release -o $publish --no-self-contained -v quiet
if ($LASTEXITCODE -ne 0) { throw 'Falló dotnet publish.' }
$unwanted = Get-ChildItem -LiteralPath $publish -Recurse -Force | Where-Object {
    $_.FullName -match '[\\/](\.secrets|tools|tests)[\\/]' -or $_.Name -match '\.key$|appsettings\.azure'
}
if ($unwanted) { throw 'Se encontró un archivo operativo privado en el paquete. Se cancela el despliegue.' }
$zip = Join-Path $out 'permisos-api.zip'
Compress-Archive -Path (Join-Path $publish '*') -DestinationPath $zip
az webapp deploy --name $AppName --resource-group $ResourceGroup --type zip --src-path $zip --clean true --restart true --only-show-errors -o none
if ($LASTEXITCODE -ne 0) { throw 'Falló el despliegue en Azure.' }
Write-Output "Publicado: $AppName. Paquete: $zip"
