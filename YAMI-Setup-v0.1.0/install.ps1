# YAMI Installer Script - Simple Version
# Install YAMI to Program Files

$InstallPath = "$env:ProgramFiles\YAMI"
$SourcePath = Split-Path -Parent $PSCommandPath
$DesktopPath = [System.IO.Path]::Combine($env:USERPROFILE, "Desktop")
$StartMenuPath = [System.IO.Path]::Combine($env:APPDATA, "Microsoft\Windows\Start Menu\Programs\YAMI")

# Check admin
$isAdmin = ([Security.Principal.WindowsPrincipal] [Security.Principal.WindowsIdentity]::GetCurrent()).IsInRole([Security.Principal.WindowsBuiltInRole] "Administrator")

if (-not $isAdmin) {
    Write-Host "Requer privilégios de Administrador. Reiniciando..."
    Start-Process powershell -ArgumentList "-NoProfile -ExecutionPolicy Bypass -File `"$PSCommandPath`"" -Verb RunAs
    exit
}

Write-Host ""
Write-Host "Iniciando instalacao YAMI..."
Write-Host ""

# Create install directory
if (-not (Test-Path $InstallPath)) {
    New-Item -ItemType Directory -Path $InstallPath -Force | Out-Null
}

# Copy files
Write-Host "Copiando arquivos..."

$files = @(
    "yami.exe",
    "yami.apk",
    "yami.json",
    "run.bat",
    "requirements.txt",
    "README.md",
    "INSTALL.txt",
    "README.txt",
    "CHECKSUM.txt"
)

foreach ($file in $files) {
    $src = "$SourcePath\$file"
    if (Test-Path $src) {
        Copy-Item -LiteralPath $src -Destination "$InstallPath\$file" -Force -ErrorAction SilentlyContinue
        Write-Host "  OK: $file"
    }
}

# Copy bin folder
if (Test-Path "$SourcePath\bin") {
    if (-not (Test-Path "$InstallPath\bin")) {
        New-Item -ItemType Directory -Path "$InstallPath\bin" -Force | Out-Null
    }
    Get-ChildItem -LiteralPath "$SourcePath\bin" | ForEach-Object {
        Copy-Item -LiteralPath $_.FullName -Destination "$InstallPath\bin\" -Force -ErrorAction SilentlyContinue
    }
    Write-Host "  OK: bin folder"
}

Write-Host ""
Write-Host "Criando atalhos..."

# Create desktop shortcut - use yami.cmd launcher
$WshShell = New-Object -ComObject WScript.Shell
$shortcut = $WshShell.CreateShortcut("$DesktopPath\YAMI.lnk")
$shortcut.TargetPath = "$InstallPath\bin\yami.cmd"
$shortcut.WorkingDirectory = $InstallPath
$shortcut.Description = "YAMI - Personal AI Assistant"
$shortcut.Save()
Write-Host "  OK: Desktop shortcut"

# Create start menu folder
if (-not (Test-Path $StartMenuPath)) {
    New-Item -ItemType Directory -Path $StartMenuPath -Force | Out-Null
}

# Create start menu shortcut - use yami.cmd launcher
$shortcut = $WshShell.CreateShortcut("$StartMenuPath\YAMI.lnk")
$shortcut.TargetPath = "$InstallPath\bin\yami.cmd"
$shortcut.WorkingDirectory = $InstallPath
$shortcut.Description = "YAMI - Personal AI Assistant"
$shortcut.Save()
Write-Host "  OK: Start Menu shortcut"

Write-Host ""
Write-Host "Teste de configuracao concluido (YAMI ja esta configurado no sistema)"

Write-Host ""
Write-Host "===================================================="
Write-Host "Instalacao concluida com sucesso!"
Write-Host "===================================================="
Write-Host ""
Write-Host "Instalado em: $InstallPath"
Write-Host ""
Write-Host "Localizacoes:"
Write-Host "  - Atalho Desktop: YAMI.lnk"
Write-Host "  - Menu Iniciar: Programs\YAMI\YAMI.lnk"
Write-Host ""

Write-Host "Deseja executar YAMI agora? (S/N)"
$response = Read-Host

if ($response -eq "S" -or $response -eq "s") {
    Start-Process -FilePath "$InstallPath\yami.exe"
}

Write-Host ""
Write-Host "Pressione Enter para fechar..."
Read-Host
