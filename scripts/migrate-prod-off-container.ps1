<#
.SYNOPSIS
    Migra el App Service de produccion (contaboxpro-prod-frontend) de modo
    contenedor Docker a modo codigo Node. CORRER UNA SOLA VEZ.

.DESCRIPTION
    Historicamente prod era Web App for Containers (imagen de
    contaboxpro-frontend-next) y scripts/deploy-zip-az-prod.ps1 hacia el toggle
    contenedor -> codigo en CADA deploy: un fallo parcial de ese toggle dejaba
    prod sirviendo la imagen Docker vieja sin ningun error.

    Este script hace ese cambio de forma definitiva:
      1. Quita la config de contenedor.
      2. Borra los app settings DOCKER_* / WEBSITES_PORT.
      3. Fija linuxFxVersion = NODE|24-lts y startup "node server.js".
      4. Fija SCM_DO_BUILD_DURING_DEPLOYMENT=false, ENABLE_ORYX_BUILD=false,
         WEBSITE_NODE_DEFAULT_VERSION=~24 (nada de build server-side de Oryx
         peleando con el standalone prebuild del zip).
      5. Reinicia.

    Despues de esto, deploy-zip-az-prod.ps1 solo VERIFICA (assert) que prod
    sigue en modo codigo; nunca vuelve a togglear. Para volver a contenedor en
    una emergencia, hazlo a mano por el portal / az.

    NO setear WEBSITE_RUN_FROM_PACKAGE: Next standalone escribe cache de ISR /
    imagenes bajo .next/cache en runtime y un mount de solo lectura lo rompe.

    Requiere Azure CLI y permisos sobre el resource group contabilizate-prod.

.EXAMPLE
    .\scripts\migrate-prod-off-container.ps1
#>

$SUBSCRIPTION  = "Patrocinio de Microsoft Azure"
$TENANTID      = "8fe11ea7-3b1f-4332-a35d-a17e129905a6"
$RESOURCEGROUP = "contabilizate-prod"
$SITENAME      = "contaboxpro-prod-frontend"
$RUNTIME       = "NODE|24-lts"

function Write-Step([string]$Message) {
    Write-Host ""
    Write-Host ">>> $Message" -ForegroundColor Cyan
}

try {
    Write-Step "1/7 - Confirmacion"
    Write-Host "Esto reconfigura el App Service de PRODUCCION '$SITENAME' (RG '$RESOURCEGROUP')" -ForegroundColor Yellow
    Write-Host "de modo contenedor a modo codigo ($RUNTIME). Se corre UNA sola vez." -ForegroundColor Yellow
    if ((Read-Host "Escribe SI para continuar") -ne "SI") {
        Write-Host "Cancelado." -ForegroundColor Yellow
        exit 0
    }

    Write-Step "2/7 - Autenticando con Azure CLI..."
    az login --tenant $TENANTID
    if ($LASTEXITCODE -ne 0) { throw "az login fallo (exit code $LASTEXITCODE)." }
    az account set --subscription $SUBSCRIPTION
    if ($LASTEXITCODE -ne 0) { throw "az account set fallo (exit code $LASTEXITCODE)." }

    Write-Step "3/7 - Quitando configuracion de contenedor..."
    az webapp config container delete --name $SITENAME --resource-group $RESOURCEGROUP
    if ($LASTEXITCODE -ne 0) { throw "az webapp config container delete fallo (exit code $LASTEXITCODE)." }

    Write-Step "4/7 - Borrando app settings DOCKER_* / WEBSITES_PORT..."
    az webapp config appsettings delete --name $SITENAME --resource-group $RESOURCEGROUP `
        --setting-names DOCKER_CUSTOM_IMAGE_NAME DOCKER_REGISTRY_SERVER_URL `
        DOCKER_REGISTRY_SERVER_USERNAME DOCKER_REGISTRY_SERVER_PASSWORD `
        DOCKER_ENABLE_CI WEBSITES_PORT
    if ($LASTEXITCODE -ne 0) { throw "az webapp config appsettings delete fallo (exit code $LASTEXITCODE)." }

    Write-Step "5/7 - Fijando runtime de codigo ($RUNTIME) y startup..."
    # az.cmd (el shim en PATH) es un batch de una linea "python.exe -IBm azure.cli %*";
    # cmd.exe reparsea %* como texto y en esa segunda pasada el "|" de "NODE|24-lts"
    # queda pelado y lo trata como pipe real, partiendo el comando. Ningun escape
    # sobrevive. Solucion: llamar directo al python.exe embebido (un .exe real,
    # PowerShell le pasa argv via CreateProcess sin que cmd reparse nada).
    $AzCmdPath = (Get-Command az -CommandType Application -ErrorAction Stop | Select-Object -First 1 -ExpandProperty Source)
    $AzPython = Join-Path (Split-Path $AzCmdPath -Parent) "..\python.exe"
    if (-not (Test-Path $AzPython)) {
        throw "No se encontro el python.exe embebido de Azure CLI junto a $AzCmdPath."
    }
    & $AzPython -IBm azure.cli webapp config set --name $SITENAME --resource-group $RESOURCEGROUP `
        --linux-fx-version $RUNTIME --startup-file "node server.js"
    if ($LASTEXITCODE -ne 0) { throw "az webapp config set fallo (exit code $LASTEXITCODE)." }

    Write-Step "6/7 - Desactivando build server-side de Oryx..."
    az webapp config appsettings set --name $SITENAME --resource-group $RESOURCEGROUP `
        --settings SCM_DO_BUILD_DURING_DEPLOYMENT=false ENABLE_ORYX_BUILD=false `
        WEBSITE_NODE_DEFAULT_VERSION=~24
    if ($LASTEXITCODE -ne 0) { throw "az webapp config appsettings set fallo (exit code $LASTEXITCODE)." }

    Write-Step "7/7 - Reiniciando..."
    az webapp restart --name $SITENAME --resource-group $RESOURCEGROUP
    if ($LASTEXITCODE -ne 0) { throw "az webapp restart fallo (exit code $LASTEXITCODE)." }

    Write-Host ""
    Write-Host "OK. Prod en modo codigo. Verifica:" -ForegroundColor Green
    Write-Host "  az webapp config show -g $RESOURCEGROUP -n $SITENAME --query '{fx:linuxFxVersion,cmd:appCommandLine}' -o jsonc"
    Write-Host "Luego publica con scripts/deploy-zip-az-prod.ps1"
}
catch {
    Write-Host ""
    Write-Host "X Error: $($_.Exception.Message)" -ForegroundColor Red
    exit 1
}
