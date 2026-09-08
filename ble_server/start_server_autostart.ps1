# CUKTECH BLE Server Autostart Script (Windows)
# Called by VBS from Startup folder at user login.
# Exits if service already running to avoid port conflict.

$ErrorActionPreference = 'Continue'

$base = "D:\Download\Widget\CUKTECH\cuktech-ble-ha\ble_server"
$log  = Join-Path $base "server.log"
$autostartLog = Join-Path $base "autostart.log"
$port = 8199

# Log autostart trigger time
$timestamp = Get-Date -Format "yyyy-MM-dd HH:mm:ss"
Add-Content -Path $autostartLog -Value "[$timestamp] Autostart script triggered" -Encoding UTF8

# Wait for system services (Bluetooth stack, network, etc.)
Start-Sleep -Seconds 8
Add-Content -Path $autostartLog -Value "[$(Get-Date -Format 'HH:mm:ss')] System ready wait complete" -Encoding UTF8

# Exit if service already running (prevent duplicate port binding)
$listening = Get-NetTCPConnection -LocalPort $port -State Listen -ErrorAction SilentlyContinue
if ($listening) {
    Add-Content -Path $autostartLog -Value "[$(Get-Date -Format 'HH:mm:ss')] Port $port already listening, skip start" -Encoding UTF8
    exit 0
}

Set-Location $base
$py = Join-Path $base ".venv\Scripts\python.exe"

# Force UTF-8 encoding (Windows default is GBK, config.yaml is UTF-8)
$env:PYTHONUTF8 = "1"
$env:PYTHONIOENCODING = "utf-8"

# Check Python interpreter exists
if (-not (Test-Path $py)) {
    Add-Content -Path $autostartLog -Value "[$(Get-Date -Format 'HH:mm:ss')] ERROR: Python interpreter not found: $py" -Encoding UTF8
    exit 1
}

Add-Content -Path $autostartLog -Value "[$(Get-Date -Format 'HH:mm:ss')] Starting ha_server.py" -Encoding UTF8

# Start service, redirect all output to server.log
& $py -u (Join-Path $base "ha_server.py") *>> $log

# If process exits, log exit code
Add-Content -Path $autostartLog -Value "[$(Get-Date -Format 'HH:mm:ss')] Service process exited, code: $LASTEXITCODE" -Encoding UTF8
