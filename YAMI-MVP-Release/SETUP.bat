@echo off
REM YAMI Setup Helper
REM This script prepares YAMI for first run

echo ==========================================
echo   YAMI MVP Setup
echo ==========================================
echo.

REM Check Node.js
where node >nul 2>nul
if %errorlevel% equ 0 (
    echo [OK] Node.js found
    node --version
) else (
    echo [ERROR] Node.js not found!
    echo Please install Node.js from: https://nodejs.org/
    echo.
    pause
    exit /b 1
)

echo.
echo Setting environment variables...

REM Get the directory where this script is located
set YAMI_HOME=%~dp0

REM Remove trailing backslash if present
if "%YAMI_HOME:~-1%"=="\" set YAMI_HOME=%YAMI_HOME:~0,-1%

setx YAMI_HOME "%YAMI_HOME%"
echo [OK] YAMI_HOME set to: %YAMI_HOME%

echo.
echo ==========================================
echo Setup complete! You can now run:
echo   yami.exe
echo Or:
echo   %YAMI_HOME%\yami.exe
echo ==========================================
echo.
pause
