@echo off
rem CUKTECH BLE Server Start Script (Windows)
rem Keep this file ASCII-only: cmd reads batch files in the OEM code page,
rem UTF-8 Chinese comments turn into mojibake before chcp takes effect.
rem Switch console to UTF-8 so Chinese log output renders correctly.
chcp 65001 >nul
cd /d "%~dp0"
set PYTHONUTF8=1
set PYTHONIOENCODING=utf-8
.venv\Scripts\python.exe -u ha_server.py
pause
