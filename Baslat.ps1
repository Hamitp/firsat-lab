$ErrorActionPreference = "Stop"
$appFolder = Split-Path -Parent $MyInvocation.MyCommand.Path
Set-Location -LiteralPath $appFolder

if (-not (Get-Command node -ErrorAction SilentlyContinue) -or -not (Get-Command npm -ErrorAction SilentlyContinue)) {
    Write-Host "Fırsat Lab'ı çalıştırmak için Node.js gerekiyor." -ForegroundColor Yellow
    Write-Host "https://nodejs.org adresinden LTS sürümünü kurup yeniden deneyin."
    exit 1
}

if (-not (Test-Path -LiteralPath (Join-Path $appFolder "node_modules"))) {
    Write-Host "İlk kullanım için uygulama hazırlanıyor. Bu işlem yalnızca bir kez yapılır..." -ForegroundColor Cyan
    npm install
    if ($LASTEXITCODE -ne 0) { exit $LASTEXITCODE }
}

$appPort = 4317
$existing = Get-NetTCPConnection -LocalPort $appPort -State Listen -ErrorAction SilentlyContinue
if (-not $existing) {
    Start-Process -FilePath "cmd.exe" -ArgumentList "/c", "npm run dev -- --port $appPort" -WorkingDirectory $appFolder -WindowStyle Hidden
}

$appUrl = "http://localhost:$appPort"
for ($attempt = 0; $attempt -lt 60; $attempt++) {
    try {
        $response = Invoke-WebRequest -UseBasicParsing -Uri $appUrl -TimeoutSec 2
        if ($response.StatusCode -eq 200) {
            Start-Process $appUrl
            Write-Host "Fırsat Lab tarayıcınızda açıldı." -ForegroundColor Green
            exit 0
        }
    } catch {
        Start-Sleep -Milliseconds 750
    }
}

Write-Host "Uygulama zamanında açılamadı. Lütfen tekrar deneyin." -ForegroundColor Red
exit 1
