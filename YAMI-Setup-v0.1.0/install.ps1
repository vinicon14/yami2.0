# YAMI Installer Script
# Este script instala YAMI em seu computador

param(
    [string]$InstallPath = "$env:ProgramFiles\YAMI"
)

# Cores
$colors = @{
    Green = [ConsoleColor]::Green
    Red = [ConsoleColor]::Red
    Yellow = [ConsoleColor]::Yellow
    Cyan = [ConsoleColor]::Cyan
}

# Função de log
function Write-Log {
    param([string]$Message, [string]$Color = "Green")
    Write-Host "[$(Get-Date -Format 'HH:mm:ss')] $Message" -ForegroundColor $Color
}

Clear-Host
Write-Host "`n╔════════════════════════════════════════════════════════════════╗" -ForegroundColor Cyan
Write-Host "║                    YAMI Installation                           ║" -ForegroundColor Cyan
Write-Host "║              Personal AI Assistant Runtime v0.1.0              ║" -ForegroundColor Cyan
Write-Host "╚════════════════════════════════════════════════════════════════╝`n" -ForegroundColor Cyan

# Caminhos
$SourcePath = "C:\Users\vinim\Downloads\yami2.0-master (3)\yami2.0-master\dist-releases"
$DesktopPath = [System.IO.Path]::Combine($env:USERPROFILE, "Desktop")
$StartMenuPath = [System.IO.Path]::Combine($env:APPDATA, "Microsoft\Windows\Start Menu\Programs\YAMI")

# Verificar permissões de administrador
Write-Log "Verificando permissões..." "Yellow"
$isAdmin = ([Security.Principal.WindowsPrincipal] [Security.Principal.WindowsIdentity]::GetCurrent()).IsInRole([Security.Principal.WindowsBuiltInRole] "Administrator")

if (-not $isAdmin) {
    Write-Log "Este instalador requer privilégios de Administrador!" "Red"
    Write-Host "`nExecutando com privilégios elevados..." -ForegroundColor Yellow
    Start-Process powershell -ArgumentList "-NoProfile -ExecutionPolicy Bypass -File `"$PSCommandPath`"" -Verb RunAs
    exit
}

Write-Log "✓ Permissões validadas" "Green"

# Verificar se o caminho de origem existe
Write-Log "Verificando arquivos de origem..." "Yellow"
if (-not (Test-Path $SourcePath)) {
    Write-Log "✗ Caminho de origem não encontrado: $SourcePath" "Red"
    Write-Host "`nPor favor, certifique-se de que o arquivo de origem existe." -ForegroundColor Red
    Read-Host "Pressione Enter para sair"
    exit
}

Write-Log "✓ Arquivos de origem encontrados" "Green"

# Criar diretório de instalação
Write-Log "Criando diretório de instalação: $InstallPath" "Yellow"
if (-not (Test-Path $InstallPath)) {
    New-Item -ItemType Directory -Path $InstallPath -Force | Out-Null
    Write-Log "✓ Diretório criado" "Green"
} else {
    Write-Log "✓ Diretório já existe" "Green"
}

# Copiar arquivos
Write-Log "Copiando arquivos..." "Yellow"
try {
    # Copiar executável
    Copy-Item -LiteralPath "$SourcePath\yami.exe" -Destination "$InstallPath\yami.exe" -Force
    Write-Log "  ✓ yami.exe copiado" "Green"
    
    # Copiar APK
    Copy-Item -LiteralPath "$SourcePath\yami.apk" -Destination "$InstallPath\yami.apk" -Force -ErrorAction SilentlyContinue
    Write-Log "  ✓ yami.apk copiado" "Green"
    
    # Copiar scripts
    Copy-Item -LiteralPath "$SourcePath\run.bat" -Destination "$InstallPath\run.bat" -Force -ErrorAction SilentlyContinue
    Write-Log "  ✓ run.bat copiado" "Green"
    
    # Copiar configuração
    Copy-Item -LiteralPath "$SourcePath\yami.json" -Destination "$InstallPath\yami.json" -Force -ErrorAction SilentlyContinue
    Write-Log "  ✓ yami.json copiado" "Green"
    
    # Copiar documentação
    Copy-Item -LiteralPath "$SourcePath\requirements.txt" -Destination "$InstallPath\requirements.txt" -Force -ErrorAction SilentlyContinue
    Copy-Item -LiteralPath "$SourcePath\README.md" -Destination "$InstallPath\README.md" -Force -ErrorAction SilentlyContinue
    Copy-Item -LiteralPath "$SourcePath\*.txt" -Destination "$InstallPath\" -Force -ErrorAction SilentlyContinue
    Write-Log "  ✓ Documentação copiada" "Green"
    
    # Copiar pasta bin
    if (Test-Path "$SourcePath\bin") {
        if (-not (Test-Path "$InstallPath\bin")) {
            New-Item -ItemType Directory -Path "$InstallPath\bin" -Force | Out-Null
        }
        Copy-Item -LiteralPath "$SourcePath\bin\*" -Destination "$InstallPath\bin\" -Recurse -Force
        Write-Log "  ✓ Pasta bin copiada" "Green"
    }
    
} catch {
    Write-Log "✗ Erro ao copiar arquivos: $_" "Red"
    Read-Host "Pressione Enter para sair"
    exit
}

# Criar atalhos
Write-Log "Criando atalhos..." "Yellow"

# Atalho na Área de Trabalho
$desktopLink = New-Object -ComObject WScript.Shell
$shortcut = $desktopLink.CreateShortcut("$DesktopPath\YAMI.lnk")
$shortcut.TargetPath = "$InstallPath\yami.exe"
$shortcut.WorkingDirectory = $InstallPath
$shortcut.Description = "YAMI - Personal AI Assistant"
$shortcut.IconLocation = "$InstallPath\yami.exe,0"
$shortcut.Save()
Write-Log "  ✓ Atalho criado na Área de Trabalho" "Green"

# Atalho no Menu Iniciar
if (-not (Test-Path $StartMenuPath)) {
    New-Item -ItemType Directory -Path $StartMenuPath -Force | Out-Null
}

$startMenuLink = New-Object -ComObject WScript.Shell
$shortcut = $startMenuLink.CreateShortcut("$StartMenuPath\YAMI.lnk")
$shortcut.TargetPath = "$InstallPath\yami.exe"
$shortcut.WorkingDirectory = $InstallPath
$shortcut.Description = "YAMI - Personal AI Assistant"
$shortcut.Save()
Write-Log "  ✓ Atalho criado no Menu Iniciar" "Green"

# Testar se o executável funciona
Write-Log "Testando executável..." "Yellow"
$process = Start-Process -FilePath "$InstallPath\yami.exe" -NoNewWindow -PassThru
Start-Sleep -Seconds 2

if ($process.HasExited -eq $false) {
    Stop-Process -Id $process.Id -Force
    Write-Log "✓ Executável testado com sucesso" "Green"
} else {
    Write-Log "⚠ Executável retornou código: $($process.ExitCode)" "Yellow"
}

# Resumo final
Write-Host "`n╔════════════════════════════════════════════════════════════════╗" -ForegroundColor Green
Write-Host "║                  ✅ INSTALAÇÃO CONCLUÍDA!                      ║" -ForegroundColor Green
Write-Host "╚════════════════════════════════════════════════════════════════╝`n" -ForegroundColor Green

Write-Host "📁 Localização:" -ForegroundColor Cyan
Write-Host "   $InstallPath`n" -ForegroundColor White

Write-Host "🔗 Atalhos Criados:" -ForegroundColor Cyan
Write-Host "   • Área de Trabalho: YAMI.lnk" -ForegroundColor White
Write-Host "   • Menu Iniciar: Programs\YAMI\YAMI.lnk`n" -ForegroundColor White

Write-Host "🚀 Como Executar:" -ForegroundColor Cyan
Write-Host "   1. Duplo clique em YAMI.lnk na Área de Trabalho" -ForegroundColor White
Write-Host "   2. Ou procure por 'YAMI' no Menu Iniciar" -ForegroundColor White
Write-Host "   3. Ou execute direto: $InstallPath\yami.exe`n" -ForegroundColor White

Write-Host "📦 Arquivos Instalados:" -ForegroundColor Cyan
Write-Host "   • yami.exe (executável principal)" -ForegroundColor White
Write-Host "   • yami.apk (para Android)" -ForegroundColor White
Write-Host "   • bin/ (arquivos de suporte)" -ForegroundColor White
Write-Host "   • Documentação e configuração`n" -ForegroundColor White

Write-Log "Instalação salva em: $InstallPath" "Green"
Write-Host "`nDeseja executar YAMI agora? (S/N) " -ForegroundColor Yellow -NoNewline
$response = Read-Host

if ($response -eq "S" -or $response -eq "s") {
    Write-Log "Iniciando YAMI..." "Yellow"
    Start-Process -FilePath "$InstallPath\yami.exe"
}

Write-Host "`nPressione Enter para fechar o instalador..." -ForegroundColor Cyan
Read-Host
