@echo off
setlocal
for %%I in ("%~dp0..") do set "YAMI_HOME=%%~fI"
set "YAMI_CONFIG_PATH=%YAMI_HOME%\yami.json"
set "OPENCLAW_HOME=%YAMI_HOME%"
set "OPENCLAW_CONFIG_PATH=%YAMI_CONFIG_PATH%"
set "OPENCLAW_STATE_DIR=%YAMI_HOME%"
if "%~1"=="--version" goto run_yami
if not exist "%YAMI_HOME%\runtime\core\node_modules\@modelcontextprotocol\sdk" if exist "%YAMI_HOME%\YAMI-RUNTIME-COMPLETE.zip" powershell -NoProfile -ExecutionPolicy Bypass -Command "Expand-Archive -LiteralPath '%YAMI_HOME%\YAMI-RUNTIME-COMPLETE.zip' -DestinationPath '%YAMI_HOME%' -Force"
:run_yami
node "%YAMI_HOME%\runtime\core\yami.mjs" %*
