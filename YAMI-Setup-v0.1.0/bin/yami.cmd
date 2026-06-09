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
REM If no arguments provided, start full mode (TUI + Gateway + Web Dashboard)
cd /d "%YAMI_HOME%"

REM Check if arguments were provided
if "%1"=="" (
    REM No arguments - start full mode
    echo Iniciando YAMI (TUI + Gateway + Web Dashboard)...
    echo.
    
    REM Start Gateway in background
    start /b cmd /c "node "%USERPROFILE%\.yami\runtime\core\yami.mjs" gateway"
    timeout /t 3 >nul
    
    REM Open Web Dashboard in browser
    start http://127.0.0.1:18789/
    timeout /t 2 >nul
    
    REM Start TUI in foreground
    node "%USERPROFILE%\.yami\runtime\core\yami.mjs" tui
) else (
    REM Arguments provided - pass them through
    node "%USERPROFILE%\.yami\runtime\core\yami.mjs" %*
)

REM Keep terminal open if YAMI exits unexpectedly
if errorlevel 1 (
    echo.
    echo [ERRO] YAMI saiu com codigo de erro: !errorlevel!
    pause
)
