param(
    [string]$Database = '',
    [string]$DatabaseUser = '',
    [string]$DatabasePassword = ''
)

$Root = Split-Path -Parent $PSScriptRoot
$Php = 'C:\Users\hp\tanamecar-runtime\php\php.exe'
$Node = 'C:\nvm4w\nodejs\node.exe'
$Logs = Join-Path $Root 'storage\logs'
New-Item -ItemType Directory -Force -Path $Logs | Out-Null

if ($Database -ne '') { $env:DB_DATABASE = $Database }
if ($DatabaseUser -ne '') { $env:DB_USERNAME = $DatabaseUser }
if ($Database -ne '' -and $DatabasePassword -ne '') { $env:DB_PASSWORD = $DatabasePassword }
if ($Database -ne '' -and $DatabaseUser -eq 'postgres' -and $DatabasePassword -eq '') { $env:DB_PASSWORD = '' }

$nodeRunning = Get-CimInstance Win32_Process -Filter "Name='node.exe'" |
    Where-Object { $_.CommandLine -like '*wadi-fetch-server.mjs*' }
if (-not $nodeRunning) {
    Start-Process -FilePath $Node -ArgumentList @('scripts\wadi-fetch-server.mjs') -WorkingDirectory $Root `
        -WindowStyle Hidden -RedirectStandardOutput (Join-Path $Logs 'wadi-fetch-server.out') `
        -RedirectStandardError (Join-Path $Logs 'wadi-fetch-server.err') | Out-Null
    Write-Output 'Service de récupération WADI démarré.'
} else {
    Write-Output 'Service de récupération WADI déjà actif.'
}

$scheduleRunning = Get-CimInstance Win32_Process -Filter "Name='php.exe'" |
    Where-Object { $_.CommandLine -like '*artisan* schedule:work*' }
if (-not $scheduleRunning) {
    Start-Process -FilePath $Php -ArgumentList @('artisan', 'schedule:work') -WorkingDirectory $Root `
        -WindowStyle Hidden -RedirectStandardOutput (Join-Path $Logs 'wadi-schedule.out') `
        -RedirectStandardError (Join-Path $Logs 'wadi-schedule.err') | Out-Null
    Write-Output 'Planificateur TANAME démarré.'
} else {
    Write-Output 'Planificateur TANAME déjà actif.'
}
