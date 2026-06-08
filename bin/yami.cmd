@echo off
setlocal
for %%I in ("%~dp0..") do set "YAMI_HOME=%%~fI"
set "YAMI_CONFIG_PATH=%YAMI_HOME%\yami.json"
set "OPENCLAW_HOME=%YAMI_HOME%"
set "OPENCLAW_CONFIG_PATH=%YAMI_CONFIG_PATH%"
set "OPENCLAW_STATE_DIR=%YAMI_HOME%"
node "%YAMI_HOME%\runtime\core\yami.mjs" %*
