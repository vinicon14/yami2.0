@echo off
title Yami
set "YAMI_HOME=%USERPROFILE%\.yami"
set "YAMI_CONFIG_PATH=%YAMI_HOME%\yami.json"
set "YAMI_PANEL_PORT=18808"
set "YAMI_ENTRYPOINT=%YAMI_HOME%\runtime\core\yami.mjs"
node "%YAMI_HOME%\auto-panel\server.js"
