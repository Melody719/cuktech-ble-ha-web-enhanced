# CUKTECH BLE Server 开机自启包装脚本 (Windows)
# 由启动文件夹VBS在用户登录时调用；服务已在运行时直接退出，避免端口冲突
$ErrorActionPreference = 'Continue'

$base = "D:\Download\Widget\CUKTECH\cuktech-ble-ha\ble_server"
$log  = Join-Path $base "server.log"
$autostartLog = Join-Path $base "autostart.log"
$port = 8199

# 记录自启触发时间
$timestamp = Get-Date -Format "yyyy-MM-dd HH:mm:ss"
Add-Content -Path $autostartLog -Value "[$timestamp] 自启脚本触发" -Encoding UTF8

# 等待系统服务就绪（蓝牙栈、网络等）
Start-Sleep -Seconds 8
Add-Content -Path $autostartLog -Value "[$(Get-Date -Format 'HH:mm:ss')] 系统就绪等待完成" -Encoding UTF8

# 若服务已在运行则退出（防止重复启动抢端口）
$listening = Get-NetTCPConnection -LocalPort $port -State Listen -ErrorAction SilentlyContinue
if ($listening) {
    Add-Content -Path $autostartLog -Value "[$(Get-Date -Format 'HH:mm:ss')] 端口$port已在监听，跳过启动" -Encoding UTF8
    exit 0
}

Set-Location $base
$py = Join-Path $base ".venv\Scripts\python.exe"

# 检查Python解释器是否存在
if (-not (Test-Path $py)) {
    Add-Content -Path $autostartLog -Value "[$(Get-Date -Format 'HH:mm:ss')] 错误: Python解释器不存在 $py" -Encoding UTF8
    exit 1
}

Add-Content -Path $autostartLog -Value "[$(Get-Date -Format 'HH:mm:ss')] 启动ha_server.py" -Encoding UTF8

# 启动服务，输出重定向到server.log
& $py -u (Join-Path $base "ha_server.py") *>> $log

# 如果进程退出，记录退出码
Add-Content -Path $autostartLog -Value "[$(Get-Date -Format 'HH:mm:ss')] 服务进程退出，退出码: $LASTEXITCODE" -Encoding UTF8
