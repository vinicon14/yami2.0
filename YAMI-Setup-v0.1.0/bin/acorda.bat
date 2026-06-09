@echo off
REM YAMI "Acorda" Command - Start YAMI
REM Usage: acorda

setlocal enabledelayedexpansion

set "YAMI_HOME=%USERPROFILE%\AppData\Local\YAMI"
set "YAMI_CMD=C:\Program Files\YAMI\bin\yami.cmd"

REM Check if YAMI is installed
if not exist "!YAMI_CMD!" (
    echo [ERRO] YAMI nao esta instalado em: !YAMI_CMD!
    echo Por favor, instale YAMI primeiro.
    exit /b 1
)

REM Check if YAMI is already running
tasklist /FI "WINDOWTITLE eq*YAMI*" 2>nul | find /I "cmd.exe" >nul
if not errorlevel 1 (
    echo [AVISO] YAMI ja esta em execucao!
    exit /b 0
)

REM Start YAMI
echo Acordando YAMI...
echo.

start "" cmd /k "!YAMI_CMD!"

exit /b 0
