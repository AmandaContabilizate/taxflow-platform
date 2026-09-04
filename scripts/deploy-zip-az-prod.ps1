<#
.SYNOPSIS
    Publica taxflow-platform en el App Service de produccion (contaboxpro-prod-frontend)
    via zip deploy con Azure CLI, sin Docker.

.DESCRIPTION
    El App Service de produccion ya vive en modo codigo (NODE|24-lts, startup
    "node server.js"). El cambio unico contenedor -> codigo lo hace
    scripts/migrate-prod-off-container.ps1 (se corre UNA sola vez). Este script
    de deploy solo:

      1. Genera el zip (scripts/build-deploy-zip.ps1 -> npm run build + empaqueta
         .next/standalone). Ese script aborta si el arbol esta sucio, el branch
         no es 'dev', o Node no coincide con .nvmrc.
      2. Pide confirmacion explicita (va a tocar produccion).
      3. Verifica (assert, no toggle) que prod sigue en modo codigo.
      4. Sube el zip con `az webapp deploy --clean true --track-status true`
         (espera a que la extraccion termine antes de reiniciar).
      5. Smoke check: espera a que el SHA construido aparezca en /auth/login.
      6. Muestra logs en vivo.

    Requiere Azure CLI >= 2.62 (por --track-status) y permisos sobre el resource
    group contabilizate-prod.

.EXAMPLE
    .\scripts\deploy-zip-az-prod.ps1
#>

$SUBSCRIPTION  = "Patrocinio de Microsoft Azure"
$TENANTID      = "8fe11ea7-3b1f-4332-a35d-a17e129905a6"
$RESOURCEGROUP = "contabilizate-prod"
$SITENAME      = "contaboxpro-prod-frontend"
$RUNTIME       = "NODE|24-lts"

$SITENAME_URL = "https://$SITENAME.azurewebsites.net"

function Write-Step([string]$Message) {
    Write-Host ""
    Write-Host ">>> $Message" -ForegroundColor Cyan
}

$Root = Split-Path -Parent $PSScriptRoot
Push-Location $Root
try {
    Write-Step "1/6 - Generando zip de deploy (npm run build + empaquetado)..."
    & "$PSScriptRoot\build-deploy-zip.ps1"
    if ($LASTEXITCODE -ne 0) {
        throw "build-deploy-zip.ps1 fallo (exit code $LASTEXITCODE)."
    }

    $Zip = Get-ChildItem -Path (Join-Path $Root "deploy") -Filter "taxflow-platform-*.zip" -File |
        Sort-Object LastWriteTime -Descending | Select-Object -First 1
    if (-not $Zip) {
        throw "No se encontro ningun zip en deploy/ tras el build."
    }
    Write-Host "  Zip a publicar: $($Zip.Name) ($([Math]::Round($Zip.Length / 1MB, 1)) MB)"

    Write-Step "2/7 - Confirmacion"
    Write-Host "Esto va a:" -ForegroundColor Yellow
    Write-Host "  - Publicar $($Zip.Name) en '$SITENAME' (RG '$RESOURCEGROUP') con --clean." -ForegroundColor Yellow
    Write-Host "  - Reiniciar el sitio de PRODUCCION al terminar la extraccion." -ForegroundColor Yellow
    $confirm = Read-Host "Escribe SI para continuar"
    if ($confirm -ne "SI") {
        Write-Host "Cancelado por el usuario." -ForegroundColor Yellow
        Pop-Location
        exit 0
    }

    Write-Step "3/7 - Autenticando con Azure CLI..."
    az login --tenant $TENANTID
    if ($LASTEXITCODE -ne 0) { throw "az login fallo (exit code $LASTEXITCODE)." }
    az account set --subscription $SUBSCRIPTION
    if ($LASTEXITCODE -ne 0) { throw "az account set fallo (exit code $LASTEXITCODE)." }

    Write-Step "4/7 - Verificando que prod sigue en modo codigo (assert, no toggle)..."
    $fx = az webapp config show -g $RESOURCEGROUP -n $SITENAME --query linuxFxVersion -o tsv
    if ($LASTEXITCODE -ne 0) { throw "az webapp config show fallo (exit code $LASTEXITCODE)." }
    if ($fx -notlike "NODE|*") {
        throw "prod esta en '$fx', no en modo codigo. Ejecuta scripts/migrate-prod-off-container.ps1 UNA vez y vuelve a correr este script."
    }
    Write-Host "  linuxFxVersion = $fx" -ForegroundColor DarkGray
    $cmd = az webapp config show -g $RESOURCEGROUP -n $SITENAME --query appCommandLine -o tsv
    if ($cmd -ne "node server.js") {
        Write-Host "  AVISO: startup actual = '$cmd'. Corrigiendo a 'node server.js'..." -ForegroundColor Yellow
        az webapp config set -g $RESOURCEGROUP -n $SITENAME --startup-file "node server.js"
        if ($LASTEXITCODE -ne 0) { throw "az webapp config set (startup) fallo (exit code $LASTEXITCODE)." }
    }

    Write-Step "5/7 - Publicando zip (--clean, esperando fin de extraccion)..."
    # --track-status hace que az espere a que la extraccion termine ANTES de
    # devolver el control; --restart true reinicia una sola vez al final. Asi
    # se elimina la carrera "restart a media extraccion" que dejaba archivos
    # viejos en .next/server/**. Requiere Azure CLI >= 2.62.
    az webapp deploy --resource-group $RESOURCEGROUP --name $SITENAME `
        --src-path $Zip.FullName --type zip `
        --clean true --restart true --track-status true
    if ($LASTEXITCODE -ne 0) {
        throw "az webapp deploy fallo (exit code $LASTEXITCODE). Si dice 'unrecognized arguments: --track-status', tu Azure CLI es < 2.62: corre 'az upgrade' y reintenta."
    }

    Write-Step "6/7 - Smoke check: esperando el SHA construido en /auth/login..."
    $ShaFile = Join-Path $Root "deploy\last-build-sha.txt"
    if (-not (Test-Path $ShaFile)) { throw "Falta deploy/last-build-sha.txt (lo genera build-deploy-zip.ps1)." }
    $ExpectedSha = (Get-Content $ShaFile -Raw).Trim()
    $Live = $false
    foreach ($i in 1..30) {
        Start-Sleep -Seconds 5
        try {
            $html = (Invoke-WebRequest "$SITENAME_URL/auth/login" -UseBasicParsing -TimeoutSec 15 `
                -Headers @{ "Cache-Control" = "no-cache" }).Content
            if ($html -match [regex]::Escape($ExpectedSha)) { $Live = $true; break }
        } catch { }
        Write-Host "  intento $i/30 - '$ExpectedSha' aun no visible..." -ForegroundColor DarkGray
    }
    if (-not $Live) {
        throw "Tras 150s el sitio no muestra el SHA '$ExpectedSha'. Revisa 'az webapp log deployment show -g $RESOURCEGROUP -n $SITENAME' y Kudu /api/vfs/site/wwwroot/.next/BUILD_ID."
    }
    Write-Host "  OK - SHA '$ExpectedSha' visible en produccion." -ForegroundColor Green

    Write-Step "7/7 - Listo. Siguiendo logs (Ctrl+C para salir)..."
    Start-Process "$SITENAME_URL"
    az webapp log tail --name $SITENAME --resource-group $RESOURCEGROUP
}
catch {
    Write-Host ""
    Write-Host "X Error: $($_.Exception.Message)" -ForegroundColor Red
    Pop-Location
    exit 1
}
Pop-Location
