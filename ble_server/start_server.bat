@echo off
rem CUKTECH BLE Server 启动脚本 (Windows)
cd /d "%~dp0"
.venv\Scripts\python.exe -u ha_server.py
pause
