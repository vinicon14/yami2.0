@echo off
setlocal
cd /d "%~dp0"
if exist "yami.exe" (
  start "" "%~dp0yami.exe"
) else (
  echo yami.exe nao encontrado nesta pasta.
  pause
)
