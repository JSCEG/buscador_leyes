param([ValidateRange(1024,65535)][int]$Port = 5317)
$ErrorActionPreference = 'Stop'
$projectRoot = $PSScriptRoot
$baseUrl = "http://127.0.0.1:$Port/"
$listener = Get-NetTCPConnection -State Listen -LocalPort $Port -ErrorAction SilentlyContinue
if ($listener) {
    $existingPage = Invoke-WebRequest -Uri $baseUrl -UseBasicParsing -TimeoutSec 10
    if ($existingPage.Content -notmatch 'Buscador de Leyes') {
        throw "El puerto $Port está ocupado por otro servicio. No se detuvo ese proceso."
    }
    Write-Output "Buscador disponible: $baseUrl"
    exit 0
}
$nodePath = (Get-Command node -ErrorAction Stop).Source
$viteScript = Join-Path $projectRoot 'node_modules/vite/bin/vite.js'
if (-not (Test-Path -LiteralPath $viteScript)) { throw 'Faltan las dependencias locales de Vite.' }
$logFolder = Join-Path $projectRoot '.local'
New-Item -ItemType Directory -Path $logFolder -Force | Out-Null
$stdoutPath = Join-Path $logFolder "vite-$Port.out.log"
$stderrPath = Join-Path $logFolder "vite-$Port.err.log"
$serverProcess = Start-Process -FilePath $nodePath -ArgumentList @(('"' + $viteScript + '"'), '--host', '127.0.0.1', '--port', "$Port", '--strictPort') -WorkingDirectory $projectRoot -WindowStyle Hidden -PassThru -RedirectStandardOutput $stdoutPath -RedirectStandardError $stderrPath
for ($attempt = 0; $attempt -lt 30; $attempt++) {
    Start-Sleep -Milliseconds 250
    $serverProcess.Refresh()
    if ($serverProcess.HasExited) {
        throw "Vite terminó durante el arranque. Revisa $stderrPath"
    }
    try {
        $page = Invoke-WebRequest -Uri $baseUrl -UseBasicParsing -TimeoutSec 2
        if ($page.StatusCode -eq 200 -and $page.Content -match 'Buscador de Leyes') {
            @{ port = $Port; processId = $serverProcess.Id; url = $baseUrl; startedAt = (Get-Date).ToString('o') } | ConvertTo-Json | Set-Content -LiteralPath (Join-Path $logFolder "vite-$Port.json") -Encoding UTF8
            Write-Output "Buscador disponible: $baseUrl (PID $($serverProcess.Id))"
            exit 0
        }
    } catch { if ($attempt -eq 29) { throw } }
}
throw "Vite no respondió a tiempo. Revisa $stdoutPath y $stderrPath"
