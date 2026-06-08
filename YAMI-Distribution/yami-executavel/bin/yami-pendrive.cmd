@echo off
setlocal
set "YAMI_HOME=%USERPROFILE%\.yami"
set "YAMI_CONFIG_PATH=%YAMI_HOME%\yami.json"
set "YAMI_PENDRIVE_DIR=%YAMI_HOME%\pendrive"
node "%YAMI_HOME%\runtime\pendrive-cli.mjs" %*
