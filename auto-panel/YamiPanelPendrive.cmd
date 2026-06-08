@echo off
title Yami Pendrive
setlocal
set "YAMI_DRIVE=%~d0"
set "YAMI_HOME=%YAMI_DRIVE%\.yami"
set "YAMI_CONFIG_PATH=%YAMI_HOME%\yami.json"
set "YAMI_PANEL_PORT=18808"
set "YAMI_ENTRYPOINT=%YAMI_HOME%\runtime\core\yami.mjs"
set "OPENCLAW_HOME=%YAMI_HOME%"
set "OPENCLAW_CONFIG_PATH=%YAMI_CONFIG_PATH%"
set "OPENCLAW_STATE_DIR=%YAMI_HOME%"
if not exist "%YAMI_HOME%\runtime\core\node_modules\@modelcontextprotocol\sdk" if exist "%YAMI_HOME%\YAMI-RUNTIME-COMPLETE.zip" powershell -NoProfile -ExecutionPolicy Bypass -Command "Expand-Archive -LiteralPath '%YAMI_HOME%\YAMI-RUNTIME-COMPLETE.zip' -DestinationPath '%YAMI_HOME%' -Force"
node "%YAMI_HOME%\auto-panel\server.js"
