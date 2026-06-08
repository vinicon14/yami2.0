@echo off
:: Yami Portable Launcher
cd /d "%~dp0"
if exist "yami.exe" (
    yami.exe %*
) else (
    echo Error: yami.exe not found!
    pause
)
