@echo off
setlocal
set "YAMI_DRIVE=%~d0"
wscript.exe "%YAMI_DRIVE%\.yami\auto-panel\YamiPanelPendriveApp.vbs"
