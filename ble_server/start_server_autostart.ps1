# CUKTECH BLE Server Autostart Script (Windows)
# Called by VBS from Startup folder at user login.
# Exits if service already running to avoid port conflict.
#
# NOTE: keep this file ASCII-only. Windows PowerShell 5.1 reads BOM-less
# files as ANSI/GBK; UTF-8 Chinese comments can break parsing.

$ErrorActionPreference = 'Continue'

$base = "D:\Download\Widget\CUKTECH\cuktech-ble-ha\ble_server"
$log  = Join-Path $base "server.log"
$autostartLog = Join-Path $base "autostart.log"
$bootstrapLog = Join-Path $base "bootstrap.log"
$port = 8199

# Decode child-process output as UTF-8 (Python emits UTF-8; PS 5.1 default
# GBK decoding produced mojibake in server.log)
try { [Console]::OutputEncoding = [System.Text.Encoding]::UTF8 } catch {}

# Log autostart trigger time
$timestamp = Get-Date -Format "yyyy-MM-dd HH:mm:ss"
Add-Content -Path $autostartLog -Value "[$timestamp] Autostart script triggered" -Encoding UTF8

# Rotate bootstrap fallback log if it exceeds 5MB. The main server.log is
# written (and rotated: 5MB x 3 generations, UTF-8) by Python's
# RotatingFileHandler via CUKTECH_LOG_FILE, so no rotation needed here.
if ((Test-Path $bootstrapLog) -and ((Get-Item $bootstrapLog).Length -gt 5MB)) {
    Move-Item -Path $bootstrapLog -Destination ($bootstrapLog + ".old") -Force
}

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

# Main log: Python RotatingFileHandler writes server.log directly (UTF-8,
# 5MB x 3 rotation). The old `*>> server.log` redirect decoded Python's
# UTF-8 output as GBK (mojibake) and never rotated (grew to 9.7MB in 2 days).
# stdout is discarded; stderr only catches WARNING+ and unhandled tracebacks
# into bootstrap.log.
$env:CUKTECH_LOG_FILE = $log

# Check Python interpreter exists
if (-not (Test-Path $py)) {
    Add-Content -Path $autostartLog -Value "[$(Get-Date -Format 'HH:mm:ss')] ERROR: Python interpreter not found: $py" -Encoding UTF8
    exit 1
}

Add-Content -Path $autostartLog -Value "[$(Get-Date -Format 'HH:mm:ss')] Starting ha_server.py" -Encoding UTF8

# Start service: logs -> server.log (Python), stderr fallback -> bootstrap.log
& $py -u (Join-Path $base "ha_server.py") 2>> $bootstrapLog 1>$null

# If process exits, log exit code
Add-Content -Path $autostartLog -Value "[$(Get-Date -Format 'HH:mm:ss')] Service process exited, code: $LASTEXITCODE" -Encoding UTF8
