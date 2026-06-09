@echo off
REM YAMI Initialization Script
REM Creates YAMI state directory structure manually
REM The state folder needs to exist for YAMI to run properly

setlocal enabledelayedexpansion

set "YAMI_HOME=%USERPROFILE%\AppData\Local\YAMI"

REM Create YAMI_HOME if it doesn't exist
if not exist "!YAMI_HOME!" (
    mkdir "!YAMI_HOME!"
    echo Criado: !YAMI_HOME!
)

REM Check if state folder already exists
if exist "!YAMI_HOME!\state" (
    echo YAMI ja inicializado anteriormente. Pulando inicializacao.
    exit /b 0
)

echo.
echo ============================================================
echo Inicializando YAMI pela primeira vez...
echo ============================================================
echo.

REM Create state directory structure
REM YAMI requires these directories to exist for proper initialization
mkdir "!YAMI_HOME!\state" 2>nul
echo Criado: state
mkdir "!YAMI_HOME!\outros" 2>nul
echo Criado: outros

REM Verify creation
if exist "!YAMI_HOME!\state" (
    echo.
    echo SUCESSO: YAMI foi inicializado com sucesso!
    echo Pasta state criada em: !YAMI_HOME!\state
    echo.
    echo Nota: Complete o setup interativo na primeira execucao.
) else (
    echo.
    echo ERRO: Nao foi possivel criar a pasta state.
    echo Por favor, crie manualmente: !YAMI_HOME!\state
)

echo.
exit /b 0
