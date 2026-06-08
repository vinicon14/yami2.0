@echo off
REM YAMI Installer - Auto Setup
REM Simple batch installer for YAMI

setlocal enabledelayedexpansion
chcp 65001 >nul 2>&1

cls
color 0A
title YAMI Installation

echo.
echo ================================================================
echo                    YAMI - Personal AI Assistant
echo                         Instalador v0.1.0
echo ================================================================
echo.
echo Iniciando instalacao...
echo.

REM Obter diretorio de origem
cd /d "%~dp0"

REM Verificar se arquivo PowerShell existe
if exist "install.ps1" (
    echo Executando script de instalacao...
    echo.
    
    REM Executar PowerShell com script
    powershell -NoProfile -ExecutionPolicy Bypass -File "%~dp0install.ps1"
    
    if errorlevel 1 (
        color 0C
        echo.
        echo Erro durante a instalacao.
        echo.
        pause
        exit /b 1
    )
    
    color 0A
    echo.
    echo Instalacao concluida com sucesso!
    echo.
    pause
    exit /b 0
) else (
    color 0C
    echo.
    echo Erro: Arquivo install.ps1 nao encontrado!
    echo.
    echo Certifique-se de que todos os arquivos estao nesta pasta.
    echo.
    pause
    exit /b 1
)
