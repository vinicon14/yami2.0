@echo off
setlocal enabledelayedexpansion

REM Yami MVP Launcher
REM This script launches the Yami local assistant runtime

set "YAMI_HOME=%USERPROFILE%\.yami"
set "YAMI_CONFIG_PATH=%YAMI_HOME%\yami.json"
set "OPENCLAW_HOME=%YAMI_HOME%"
set "OPENCLAW_CONFIG_PATH=%YAMI_CONFIG_PATH%"
set "OPENCLAW_STATE_DIR=%YAMI_HOME%"

REM Launch the Yami runtime
node "%YAMI_HOME%\runtime\core\yami.mjs" %*

exit /b %errorlevel%
