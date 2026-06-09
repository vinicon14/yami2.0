@echo off
REM YAMI Voice Service
REM Listens for voice commands: "acorda" and "descansa"

setlocal enabledelayedexpansion

set "YAMI_HOME=%USERPROFILE%\AppData\Local\YAMI"
set "VOICE_SCRIPT=%~dp0voice-listener.js"

cls
echo.
echo ============================================
echo    YAMI Voice Recognition Service v0.1.0
echo ============================================
echo.
echo Starting voice listener...
echo.
echo Listening for commands:
echo   * "acorda" - Start YAMI
echo   * "descansa" - Stop YAMI
echo.

node "%VOICE_SCRIPT%"

if errorlevel 1 (
    echo.
    echo Error running voice service.
    echo Please ensure Node.js is installed and accessible.
    pause
    exit /b 1
)

exit /b 0
