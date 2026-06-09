@echo off
REM YAMI "Descansa" Command - Stop YAMI
REM Usage: descansa

setlocal enabledelayedexpansion

echo Descansando YAMI...
echo.

REM Kill all YAMI processes
taskkill /F /IM cmd.exe /FI "WINDOWTITLE eq*YAMI*" 2>nul
taskkill /F /IM node.exe /FI "COMMANDLINE eq*yami.mjs*" 2>nul

REM Check if process was killed
if errorlevel 1 (
    echo [AVISO] Nenhuma instancia de YAMI encontrada em execucao.
    exit /b 0
) else (
    echo YAMI foi encerrado com sucesso.
    exit /b 0
)
