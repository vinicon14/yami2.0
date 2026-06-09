@echo off
REM YAMI Full Launcher - Starts Gateway, TUI, and Web Dashboard
REM This launcher starts all YAMI components for complete experience

setlocal enabledelayedexpansion

set "YAMI_HOME=%USERPROFILE%\AppData\Local\YAMI"
set "OPENCLAW_HOME=%YAMI_HOME%"
set "OPENCLAW_CONFIG_PATH=%YAMI_HOME%\yami.json"
set "YAMI_RUNTIME=%USERPROFILE%\.yami\runtime\core"

cls
echo.
echo ============================================
echo    YAMI v0.1.0 - Inicializador Completo
echo ============================================
echo.
echo Iniciando todos os componentes...
echo.

REM Verify Node.js
where /q node
if errorlevel 1 (
    echo [ERRO] Node.js nao encontrado
    pause
    exit /b 1
)

REM Start Gateway in background (port 18789)
echo [1/3] Iniciando Gateway (port 18789)...
start /b cmd /c "cd /d "!YAMI_HOME!" && node "!YAMI_RUNTIME!\yami.mjs" gateway"
timeout /t 2 >nul

REM Start TUI in new window
echo [2/3] Iniciando Terminal Interface...
start "YAMI Terminal" cmd /k "cd /d "!YAMI_HOME!" && node "!YAMI_RUNTIME!\yami.mjs" tui"

REM Open Web Dashboard in browser
echo [3/3] Abrindo Dashboard Web...
timeout /t 3 >nul
start http://127.0.0.1:18789/

echo.
echo ============================================
echo YAMI iniciado com sucesso!
echo ============================================
echo.
echo Componentes ativos:
echo   - TUI (Terminal Interface)
echo   - Gateway (port 18789)
echo   - Web Dashboard (http://127.0.0.1:18789/)
echo.
echo Para parar YAMI, use:  descansa
echo.
pause
