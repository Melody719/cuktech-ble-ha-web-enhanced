' CUKTECH BLE Server 开机自启 (启动文件夹方式, 无窗口)
Set ws = CreateObject("Wscript.Shell")
ws.Run "powershell.exe -NoProfile -ExecutionPolicy Bypass -WindowStyle Hidden -File ""D:\Download\Widget\CUKTECH\cuktech-ble-ha\ble_server\start_server_autostart.ps1""", 0, False
