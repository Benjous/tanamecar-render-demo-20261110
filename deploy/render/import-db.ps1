param(
    [Parameter(Mandatory = $true)]
    [string] $DatabaseUrl,
    [string] $DumpPath = ""
)

$ErrorActionPreference = "Stop"
$psql = Join-Path $env:USERPROFILE "tanamecar-runtime\pgsql\bin\psql.exe"

if (-not (Test-Path $psql)) {
    throw "psql introuvable : $psql"
}

if ([string]::IsNullOrWhiteSpace($DumpPath)) {
    $private = Get-ChildItem (Join-Path $env:USERPROFILE "Documents") -Directory |
        Where-Object { $_.Name -like "Projet par*" } |
        Select-Object -First 1
    $DumpPath = Join-Path $private.FullName "private\DEPLOIEMENT-RENDER-2026-11-10\tanamecar_demo_render.sql"
}

if (-not (Test-Path $DumpPath)) {
    throw "Dump introuvable : $DumpPath"
}

Write-Host "Import du dump isolé vers la base Render..."
& $psql $DatabaseUrl -v ON_ERROR_STOP=1 -f $DumpPath
if ($LASTEXITCODE -ne 0) {
    throw "Import PostgreSQL échoué."
}

Write-Host "Vérification des volumes..."
& $psql $DatabaseUrl -Atc "select 'clients', count(*) from clients union all select 'contracts', count(*) from contracts union all select 'stored_files', count(*) from stored_files union all select 'vehicle_deadlines', count(*) from vehicle_deadlines;"
if ($LASTEXITCODE -ne 0) {
    throw "Vérification PostgreSQL échouée."
}

Write-Host "Import terminé."
