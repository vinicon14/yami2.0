<#
.SYNOPSIS
  Compiles the YAMI PowerShell installer into a .exe file.
  Requires: PS2EXE module (Install-Module -Name ps2exe -Force)
  Fallback: Uses IExpress if PS2EXE not available.
#>

param(
  [string]$OutputPath = "C:\Users\vinim\.yami\pendrive-installer\installer\YamiSetup.exe",
  [switch]$UseIExpress
)

$ErrorActionPreference = "Stop"
$ScriptPath = "C:\Users\vinim\.yami\pendrive-installer\installer\YamiInstaller.ps1"

if (-not (Test-Path $ScriptPath)) {
  Write-Error "Installer script not found: $ScriptPath"
  exit 1
}

if ($UseIExpress -or -not (Get-Module -ListAvailable -Name ps2exe)) {
  Write-Host "[Yami Builder] Usando IExpress para compilar .exe..." -ForegroundColor Cyan
  Write-Host "[Yami Builder] Alternativa: Convert-PS2EXE do modulo ps2exe" -ForegroundColor Yellow
  Write-Host ""
  Write-Host "Para compilar com ps2exe (recomendado):" -ForegroundColor White
  Write-Host "  Install-Module -Name ps2exe -Force" -ForegroundColor Gray
  Write-Host "  ps2exe `"$ScriptPath`" `"$OutputPath`" -noConsole" -ForegroundColor Gray
  Write-Host ""
  Write-Host "Para usar IExpress manualmente:" -ForegroundColor White
  Write-Host "  1. Execute iexpress.exe" -ForegroundColor Gray
  Write-Host "  2. Selecione 'Create new Self Extraction Directive file'" -ForegroundColor Gray
  Write-Host "  3. Package: 'Extract files and run an installation command'" -ForegroundColor Gray
  Write-Host "  4. Title: 'Yami Installer'" -ForegroundColor Gray
  Write-Host "  5. Install program: 'powershell.exe -NoProfile -ExecutionPolicy Bypass -File YamiInstaller.ps1'" -ForegroundColor Gray
  Write-Host "  6. Output: '$OutputPath'" -ForegroundColor Gray
  Write-Host ""

  # Generate a SED file for IExpress
  $sedContent = @"
[Version]
Class=IEXPRESS
SEDVersion=3
[Options]
PackagePurpose=InstallApp
ShowInstallProgramWindow=0
HideExtractAnimation=1
UseLongFileName=1
InsideCompressed=0
CAB_FixedSize=0
CAB_ResvCodeSigning=0
RebootMode=N
InstallPrompt=%InstallPrompt%
DisplayLicense=%DisplayLicense%
FinishMessage=%FinishMessage%
TargetName=%TargetName%
FriendlyName=%FriendlyName%
AppLaunched=%AppLaunched%
PostInstallCmd=%PostInstallCmd%
AdminQuietInstCmd=%AdminQuietInstCmd%
UserQuietInstCmd=%UserQuietInstCmd%
SourceFiles=SourceFiles

[Strings]
AppLaunched=powershell.exe -NoProfile -ExecutionPolicy Bypass -File "YamiInstaller.ps1"
PostInstallCmd=<None>
AdminQuietInstCmd=
UserQuietInstCmd=
FriendlyName=Yami Instalador
TargetName=$OutputPath
SourceFiles=SourceFiles
InstallPrompt=
DisplayLicense=
FinishMessage=Yami instalado com sucesso!
[SourceFiles]
File0=$PSScriptRoot\..\installer\YamiInstaller.ps1
[SourceFiles0]
%FILE0%=YamiInstaller.ps1
"@

  $sedPath = "$env:TEMP\yami-installer.sed"
  $sedContent | Out-File $sedPath -Encoding ascii
  Write-Host "[Yami Builder] Arquivo SED gerado: $sedPath" -ForegroundColor Green
  Write-Host "[Yami Builder] Execute manualmente: iexpress /N /Q $sedPath" -ForegroundColor Yellow

  # Try using ps2exe if available
  try {
    Import-Module ps2exe -ErrorAction SilentlyContinue
    if (Get-Command ps2exe -ErrorAction SilentlyContinue) {
      Write-Host "[Yami Builder] Compilando com ps2exe..." -ForegroundColor Cyan
      ps2exe -inputFile $ScriptPath -outputFile $OutputPath -noConsole -iconFile "C:\Users\vinim\.yami\pendrive-installer\assets\tamagotchi\yami.ico" -errorAction SilentlyContinue
      if (Test-Path $OutputPath) {
        Write-Host "[Yami Builder] .exe criado: $OutputPath" -ForegroundColor Green
        return
      }
    }
  } catch {
    Write-Warning "ps2exe nao disponivel. Use IExpress manualmente."
  }

  Write-Host "[Yami Builder] Nao foi possivel compilar automaticamente." -ForegroundColor Red
  Write-Host "[Yami Builder] O instalador .ps1 pode ser executado diretamente." -ForegroundColor Yellow
} else {
  Write-Host "[Yami Builder] Compilando com ps2exe..." -ForegroundColor Cyan
  ps2exe -inputFile $ScriptPath -outputFile $OutputPath -noConsole
  if (Test-Path $OutputPath) {
    Write-Host "[Yami Builder] .exe criado: $OutputPath" -ForegroundColor Green
  } else {
    Write-Error "Falha ao compilar .exe"
  }
}
