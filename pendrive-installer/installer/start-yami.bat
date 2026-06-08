@echo off
title Yami
set YAMI_HOME=%USERPROFILE%\.yami
set YAMI_CONFIG_PATH=%YAMI_HOME%\yami.json
set YAMI_PANEL_PORT=18808
set YAMI_ENTRYPOINT=%YAMI_HOME%\runtime\core\yami.mjs

echo.
echo  ================================
echo    Iniciando Yami...
echo  ================================
echo.

:: Check if panel is already running
netstat -an | find "127.0.0.1:18808" >nul 2>&1
if %ERRORLEVEL% NEQ 0 (
  echo  [Yami] Iniciando servidor do painel...
  start /B node "%YAMI_HOME%\auto-panel\server.js"
  timeout /t 2 /nobreak >nul
)

echo  [Yami] Abrindo Dashboard Yami...
start "" http://127.0.0.1:18808/?voice=1
echo.
echo  Yami esta rodando em segundo plano.
echo  Feche esta janela para continuar usando o Yami.
echo.
pause
