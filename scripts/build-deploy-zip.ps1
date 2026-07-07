<#
.SYNOPSIS
    Genera el .zip listo para publicar en Azure App Service (sin Docker).

.DESCRIPTION
    Usa `output: "standalone"` (next.config.mjs) - Next ya deja en
    .next/standalone un server Node autocontenido con solo los node_modules
    realmente usados. Este script solo completa lo que Next NO copia ahi por
    defecto (.next/static y public/), quita los .env* que Next SI copia por
    conveniencia (nunca deben ir en el zip - los secretos viven en
    Application Settings de Azure), y empaqueta el resultado.

    Equivalente en Node: scripts/build-deploy-zip.mjs (usa npm run deploy:zip).

.EXAMPLE
    .\scripts\build-deploy-zip.ps1
#>

# OJO: no usar $ErrorActionPreference = "Stop" a nivel de script — en
# PowerShell 5.1 eso hace que CUALQUIER línea que un proceso nativo (npm/
# node) escriba a stderr (incluso un warning inofensivo, no un error real)
# se convierta en un NativeCommandError terminante, abortando el script a
# mitad del build. Los cmdlets de PowerShell abajo llevan su propio
# -ErrorAction Stop donde hace falta, y los comandos nativos se verifican
# con $LASTEXITCODE.

$Root = Split-Path -Parent $PSScriptRoot

function Write-Step([string]$Message) {
    Write-Host ""
    Write-Host "-> $Message" -ForegroundColor Cyan
}

Push-Location $Root
try {
    $StandaloneDir = Join-Path $Root ".next\standalone"
    $StaticSrc     = Join-Path $Root ".next\static"
    $StaticDest    = Join-Path $StandaloneDir ".next\static"
    $PublicSrc     = Join-Path $Root "public"
    $PublicDest    = Join-Path $StandaloneDir "public"

    $OutputDir  = Join-Path $Root "deploy"
    $Timestamp  = Get-Date -Format "yyyy-MM-ddTHH-mm-ss"
    $OutputZip  = Join-Path $OutputDir "taxflow-platform-$Timestamp.zip"

    Write-Step "1/5 - Compilando el proyecto (next build)..."
    npm run build
    if ($LASTEXITCODE -ne 0) {
        throw "El build fallo (exit code $LASTEXITCODE)."
    }

    if (-not (Test-Path $StandaloneDir)) {
        throw "No se encontro .next/standalone tras el build. Confirma que next.config.mjs tiene output: 'standalone'."
    }

    Write-Step "2/5 - Copiando .next/static y public/ dentro del standalone..."
    if (Test-Path $StaticDest) { Remove-Item $StaticDest -Recurse -Force -ErrorAction Stop }
    Copy-Item $StaticSrc $StaticDest -Recurse -Force -ErrorAction Stop

    if (Test-Path $PublicSrc) {
        if (Test-Path $PublicDest) { Remove-Item $PublicDest -Recurse -Force -ErrorAction Stop }
        Copy-Item $PublicSrc $PublicDest -Recurse -Force -ErrorAction Stop
    }

    Write-Step "3/5 - Quitando archivos .env* que Next copia solo por conveniencia..."
    Get-ChildItem -Path $StandaloneDir -Filter ".env*" -File -Force -ErrorAction Stop | ForEach-Object {
        Remove-Item $_.FullName -Force -ErrorAction Stop
        Write-Host "  - eliminado $($_.Name)"
    }

    Write-Step "4/5 - Preparando carpeta de salida..."
    if (-not (Test-Path $OutputDir)) {
        New-Item -ItemType Directory -Path $OutputDir -ErrorAction Stop | Out-Null
    }

    $relZip = $OutputZip.Substring($Root.Length).TrimStart('\', '/')
    Write-Step "5/5 - Empaquetando $StandaloneDir -> $relZip"
    # NO usar Compress-Archive: guarda los nombres de entrada del zip con
    # separador de ruta "\" (estilo Windows) en vez de "/" (el que exige el
    # formato zip). En Linux (App Service), rsync intenta stat() un nombre
    # de archivo LITERAL como ".next\server\app\..." — como "\" no es
    # separador de carpetas ahi, falla con "Invalid argument (22)" en cada
    # archivo anidado y el deploy entero se cae. Se arma el zip a mano con
    # System.IO.Compression para forzar "/" en cada entrada.
    if (Test-Path $OutputZip) { Remove-Item $OutputZip -Force -ErrorAction Stop }
    Add-Type -AssemblyName System.IO.Compression -ErrorAction Stop
    Add-Type -AssemblyName System.IO.Compression.FileSystem -ErrorAction Stop

    $zipStream = [System.IO.File]::Open($OutputZip, [System.IO.FileMode]::Create)
    $archive = New-Object System.IO.Compression.ZipArchive($zipStream, [System.IO.Compression.ZipArchiveMode]::Create)
    try {
        $files = Get-ChildItem -Path $StandaloneDir -Recurse -File -Force -ErrorAction Stop
        foreach ($file in $files) {
            $relativePath = $file.FullName.Substring($StandaloneDir.Length).TrimStart('\', '/').Replace('\', '/')
            $entry = $archive.CreateEntry($relativePath, [System.IO.Compression.CompressionLevel]::Optimal)
            $entryStream = $entry.Open()
            try {
                $fileStream = [System.IO.File]::OpenRead($file.FullName)
                try { $fileStream.CopyTo($entryStream) }
                finally { $fileStream.Dispose() }
            }
            finally { $entryStream.Dispose() }
        }
    }
    finally {
        $archive.Dispose()
        $zipStream.Dispose()
    }

    $sizeMB = [Math]::Round((Get-Item $OutputZip -ErrorAction Stop).Length / 1MB, 1)
    Write-Host ""
    Write-Host "OK Listo: $relZip ($sizeMB MB)" -ForegroundColor Green
    Write-Host ""
    Write-Host "En Azure App Service, el Startup Command para este paquete es:"
    Write-Host "  node server.js"
    Write-Host "(no 'next start' - ese es el server generado por output: standalone)"
}
catch {
    Write-Host ""
    Write-Host "X Error: $($_.Exception.Message)" -ForegroundColor Red
    Pop-Location
    exit 1
}
Pop-Location
