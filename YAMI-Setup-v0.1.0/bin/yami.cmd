@echo off
setlocal enabledelayedexpansion

REM YAMI Launcher - Ensures interactive terminal with stdin access
REM Set environment variables for YAMI
set "YAMI_HOME=%USERPROFILE%\AppData\Local\YAMI"
set "YAMI_CONFIG_PATH=%YAMI_HOME%\yami.json"
set "OPENCLAW_HOME=%YAMI_HOME%"
set "OPENCLAW_CONFIG_PATH=%YAMI_CONFIG_PATH%"
set "OPENCLAW_STATE_DIR=%YAMI_HOME%"

REM Verify Node.js is available
where /q node
if errorlevel 1 (
    echo [ERROR] Node.js nao encontrado no PATH
    echo Por favor instale Node.js v22.19 ou superior
    pause
    exit /b 1
)

REM Run YAMI with full interactive terminal access
REM The /D switch ensures stdin/stdout/stderr are properly connected
cd /d "%YAMI_HOME%"
node "%YAMI_HOME%\..\..\.yami\runtime\core\yami.mjs" %*

REM Keep terminal open if YAMI exits unexpectedly
if errorlevel 1 (
    echo.
    echo [ERRO] YAMI saiu com codigo de erro: !errorlevel!
    pause
)
