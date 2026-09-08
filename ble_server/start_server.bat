@echo off
rem CUKTECH BLE Server Start Script (Windows)
cd /d "%~dp0"
set PYTHONUTF8=1
set PYTHONIOENCODING=utf-8
.venv\Scripts\python.exe -u ha_server.py
pause