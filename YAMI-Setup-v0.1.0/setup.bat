@echo off
chcp 65001 >nul
setlocal enabledelayedexpansion

REM YAMI Setup Script
REM Este script inicia o instalador PowerShell

color 0A
title YAMI Installation

echo.
echo ╔════════════════════════════════════════════════════════════════╗
echo ║                    YAMI Setup - Carregando...                 ║
echo ╚════════════════════════════════════════════════════════════════╝
echo.

REM Executar o script PowerShell de instalação
powershell -NoProfile -ExecutionPolicy Bypass -File "%~dp0YAMI-Installer.ps1"

if errorlevel 1 (
    color 0C
    echo.
    echo ✗ Ocorreu um erro durante a instalação.
    echo.
    pause
    exit /b 1
)

color 0A
echo.
echo ✓ Instalação concluída com sucesso!
echo.
pause
exit /b 0
