<#
.SYNOPSIS
    Publica taxflow-platform en el App Service de produccion (contaboxpro-prod-frontend)
    via zip deploy con Azure CLI, sin Docker.

.DESCRIPTION
    El App Service de produccion hoy esta configurado como Web App for Containers
    (imagen Docker de contaboxpro-frontend-next). El portal de Azure no deja subir
    un zip mientras siga en modo contenedor, asi que este script:

      1. Genera el zip (scripts/build-deploy-zip.ps1 -> npm run build + empaqueta
         .next/standalone).
      2. Pide confirmacion explicita (va a tocar produccion).
      3. Cambia el App Service de modo contenedor a modo codigo (NODE|20-lts,
         startup command "node server.js").
      4. Sube el zip con `az webapp deploy`.
      5. Reinicia y muestra logs en vivo.

    Requiere Azure CLI instalado y permisos sobre el resource group contabilizate-prod.

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

    Write-Step "2/6 - Confirmacion"
    Write-Host "Esto va a:" -ForegroundColor Yellow
    Write-Host "  - Quitar la configuracion de contenedor Docker de '$SITENAME' (RG '$RESOURCEGROUP')." -ForegroundColor Yellow
    Write-Host "  - Cambiarlo a runtime de codigo ($RUNTIME) con startup 'node server.js'." -ForegroundColor Yellow
    Write-Host "  - Publicar $($Zip.Name) y reiniciar el sitio de PRODUCCION." -ForegroundColor Yellow
    $confirm = Read-Host "Escribe SI para continuar"
    if ($confirm -ne "SI") {
        Write-Host "Cancelado por el usuario." -ForegroundColor Yellow
        Pop-Location
        exit 0
    }

    Write-Step "3/6 - Autenticando con Azure CLI..."
    az login --tenant $TENANTID
    if ($LASTEXITCODE -ne 0) { throw "az login fallo (exit code $LASTEXITCODE)." }
    az account set --subscription $SUBSCRIPTION
    if ($LASTEXITCODE -ne 0) { throw "az account set fallo (exit code $LASTEXITCODE)." }

    Write-Step "4/6 - Cambiando App Service de contenedor a codigo ($RUNTIME)..."
    az webapp config container delete --name $SITENAME --resource-group $RESOURCEGROUP
    if ($LASTEXITCODE -ne 0) { throw "az webapp config container delete fallo (exit code $LASTEXITCODE)." }

    # az.cmd (el shim que expone "az" en PATH) es un batch de una linea:
    #   python.exe -IBm azure.cli %*
    # cmd.exe sustituye %* como TEXTO dentro de esa linea y la vuelve a
    # parsear para ejecutarla — en esa segunda pasada el "|" de
    # "NODE|20-lts" queda "pelado" (el caret ya se consumio en la primera
    # pasada al tokenizar nuestro propio comando) y cmd lo trata como pipe
    # real, partiendo el comando en dos. Ningun escape en nuestra linea
    # sobrevive esa doble pasada — es un bug estructural del forwarding de
    # az.cmd, no un problema de comillas/caret de nuestro lado.
    #
    # Solucion: saltarse az.cmd por completo y llamar directo al python.exe
    # que trae embebido el CLI. Al ser un .exe real (no un .bat), PowerShell
    # le pasa el argv tal cual via CreateProcess, sin que cmd.exe reparse
    # nada — el "|" llega intacto sin necesitar ningun escape.
    $AzCmdPath = (Get-Command az -CommandType Application -ErrorAction Stop | Select-Object -First 1 -ExpandProperty Source)
    $AzPython = Join-Path (Split-Path $AzCmdPath -Parent) "..\python.exe"
    if (-not (Test-Path $AzPython)) {
        throw "No se encontro el python.exe embebido de Azure CLI junto a $AzCmdPath."
    }
    & $AzPython -IBm azure.cli webapp config set --name $SITENAME --resource-group $RESOURCEGROUP --linux-fx-version $RUNTIME --startup-file "node server.js"
    if ($LASTEXITCODE -ne 0) { throw "az webapp config set fallo (exit code $LASTEXITCODE)." }

    Write-Step "5/6 - Publicando zip..."
    az webapp deploy --resource-group $RESOURCEGROUP --name $SITENAME --src-path $Zip.FullName --type zip
    if ($LASTEXITCODE -ne 0) { throw "az webapp deploy fallo (exit code $LASTEXITCODE)." }

    az webapp restart --name $SITENAME --resource-group $RESOURCEGROUP
    if ($LASTEXITCODE -ne 0) { throw "az webapp restart fallo (exit code $LASTEXITCODE)." }

    Write-Step "6/6 - Listo. Siguiendo logs (Ctrl+C para salir)..."
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
