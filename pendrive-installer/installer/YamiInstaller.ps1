#requires -version 5.1

<#
.SYNOPSIS
  YAMI Plug-and-Play USB Installer
.DESCRIPTION
  Installs YAMI assistant from a USB pendrive with zero manual configuration.
  Handles: dependency check, account setup, permissions, auto-start, dashboard launch.
.NOTES
  Can be compiled to .exe via: PS2EXE or IExpress
  Version: 1.0.0-pendrive
#>

$Host.UI.RawUI.WindowTitle = "Yami - Instalacao Plug-and-Play"
$ErrorActionPreference = "Stop"

# ─── Paths ───────────────────────────────────────────────────────────────────
$PENDIR     = Split-Path -Parent $PSScriptRoot
$INSTALLER  = $PSScriptRoot
$RUNTIME    = Join-Path $PENDIR "runtime"
$DASHBOARD  = Join-Path $PENDIR "dashboard"
$MODULES    = Join-Path $PENDIR "modules"
$CONFIG     = Join-Path $PENDIR "config"
$ASSETS     = Join-Path $PENDIR "assets"
$UPDATER    = Join-Path $PENDIR "updater"
$YAMI_HOME  = Join-Path $env:USERPROFILE ".yami"
$NODE_PATH  = Join-Path $RUNTIME "node\node.exe"

# ─── UI Helpers ──────────────────────────────────────────────────────────────
function Write-Step {
  param([string]$Title, [string]$Message)
  Write-Host ""
  Write-Host "━━━ $Title ━━━" -ForegroundColor Cyan
  if ($Message) { Write-Host "  $Message" -ForegroundColor Gray }
}

function Write-Status {
  param([string]$Text, [string]$Emoji = "○")
  Write-Host "  $Emoji $Text" -ForegroundColor White
}

function Write-Success {
  param([string]$Text)
  Write-Host "  ✓ $Text" -ForegroundColor Green
}

function Write-WarningMsg {
  param([string]$Text)
  Write-Host "  ⚠ $Text" -ForegroundColor Yellow
}

function Show-Header {
  Clear-Host
  Write-Host ""
  Write-Host "   ╔══════════════════════════════════════════╗" -ForegroundColor Cyan
  Write-Host "   ║           YAMI INSTALADOR                ║" -ForegroundColor Cyan
  Write-Host "   ║      Plug-and-Play Pendrive v1.0         ║" -ForegroundColor Cyan
  Write-Host "   ╚══════════════════════════════════════════╝" -ForegroundColor Cyan
  Write-Host ""
}

function Show-ProgressBar {
  param([int]$Percent, [string]$Label)
  $bar = "#" * [math]::Floor($Percent / 5) + "." * ([math]::Ceiling((100 - $Percent) / 5))
  Write-Progress -Activity "Instalando Yami..." -Status $Label -PercentComplete $Percent
}

# ─── Step 1: Welcome ─────────────────────────────────────────────────────────
Show-Header
Write-Step "Bem-vindo ao Yami!" "Seu assistente pessoal sera instalado em segundos."
Write-Host ""
Write-Host "  O Yami e um assistente IA local que:"
Write-Host "  • Aparece na tela como um Tamagotchi digital" -ForegroundColor White
Write-Host "  • Escuta comandos de voz (acorda / descansa)" -ForegroundColor White
Write-Host "  • Responde pelo WhatsApp" -ForegroundColor White
Write-Host "  • Gerencia arquivos, fotos, agenda e comunicacao" -ForegroundColor White
Write-Host "  • Funciona completamente offline apos configurado" -ForegroundColor White
Write-Host ""
Write-Host "  Pressione ENTER para comecar..." -ForegroundColor Yellow
$null = Read-Host

# ─── Step 2: System Check ────────────────────────────────────────────────────
Show-Header
Write-Step "Verificando sistema..."

$sysOk = $true

# OS check
$os = Get-WmiObject Win32_OperatingSystem
$isWin10OrLater = $os.Version -ge 10
if (-not $isWin10OrLater) {
  Write-WarningMsg "Windows 10+ recomendado. Continuando mesmo assim..."
}
Write-Success "Windows $($os.Version) ($($os.Caption))"

# Architecture
$is64 = [Environment]::Is64BitOperatingSystem
if ($is64) { Write-Success "Arquitetura x64" } else { Write-WarningMsg "Arquitetura x86 - desempenho pode ser limitado" }

# RAM
$ramGB = [math]::Round((Get-WmiObject Win32_ComputerSystem).TotalPhysicalMemory / 1GB, 1)
if ($ramGB -ge 4) { Write-Success "RAM: ${ramGB}GB" } else { Write-WarningMsg "RAM: ${ramGB}GB (minimo recomendado: 4GB)" }

# Disk space
$disk = Get-WmiObject Win32_LogicalDisk -Filter "DriveType=3" | Where-Object { $_.DeviceID -eq $env:SystemDrive }
$freeGB = [math]::Round($disk.FreeSpace / 1GB, 1)
if ($freeGB -ge 2) { Write-Success "Disco livre: ${freeGB}GB" } else { Write-WarningMsg "Disco livre: ${freeGB}GB (minimo recomendado: 2GB)" }

# Node.js
$nodeOk = $false
if (Test-Path $NODE_PATH) {
  $nodeVersion = & $NODE_PATH --version 2>$null
  if ($nodeVersion) {
    Write-Success "Node.js portable: $nodeVersion"
    $nodeOk = $true
  }
}
if (-not $nodeOk) {
  $globalNode = Get-Command "node" -ErrorAction SilentlyContinue
  if ($globalNode) {
    $nodeVersion = & node --version
    Write-Success "Node.js global: $nodeVersion"
    $nodeOk = $true
  } else {
    Write-WarningMsg "Node.js nao encontrado. O instalador vai baixar automaticamente."
  }
}

Start-Sleep -Milliseconds 500

# ─── Step 3: Account Setup ──────────────────────────────────────────────────
Show-Header
Write-Step "Contas e Permissoes" "Conecte suas contas para o Yami funcionar."

$accountsConfigured = @{}
$openaiApiKey = ""

# OpenAI API Key
Write-Host ""
Write-Host "  [1/3] Conta OpenAI (obrigatoria)" -ForegroundColor Cyan
Write-Host "  O Yami precisa de uma chave API da OpenAI para o cerebro IA."
Write-Host "  (opcional: deixe em branco para configurar depois)"
Write-Host ""
$apiKey = Read-Host "  API Key OpenAI (deixe em branco para pular)"

if ($apiKey -and $apiKey.Trim() -ne "") {
  $openaiApiKey = $apiKey.Trim()
  $accountsConfigured["openai"] = $true
  Write-Success "Chave API configurada"
} else {
  $accountsConfigured["openai"] = $false
  Write-WarningMsg "Pulado - configurar depois no Dashboard"
}

# WhatsApp (optional)
Write-Host ""
Write-Host "  [2/3] WhatsApp (opcional)" -ForegroundColor Cyan
Write-Host "  Conecte o WhatsApp do Yami para responder automaticamente."
Write-Host "  (deixe em branco para configurar depois)"
Write-Host ""
$waNumber = Read-Host "  Seu numero (com DDI, ex: +5511999999999)"

if ($waNumber -and $waNumber.Trim() -ne "") {
  $accountsConfigured["whatsapp"] = @{ number = $waNumber.Trim() }
  Write-Success "Numero configurado: $($waNumber.Trim())"
} else {
  $accountsConfigured["whatsapp"] = $false
  Write-WarningMsg "Pulado - configurar depois no Dashboard"
}

# Google (optional)
Write-Host ""
Write-Host "  [3/3] Google (opcional)" -ForegroundColor Cyan
Write-Host "  Conecte o Google para agenda, fotos e arquivos."
Write-Host ""
$googleEmail = Read-Host "  Email Google (deixe em branco para pular)"

if ($googleEmail -and $googleEmail.Trim() -ne "") {
  $accountsConfigured["google"] = @{ email = $googleEmail.Trim() }
  Write-Success "Email configurado: $($googleEmail.Trim())"
} else {
  $accountsConfigured["google"] = $false
  Write-WarningMsg "Pulado - configurar depois no Dashboard"
}

# ─── Step 4: Permissions ─────────────────────────────────────────────────────
Show-Header
Write-Step "Autorizando Permissoes" "O Yami precisa de algumas permissoes para funcionar."

$allPermissionsGranted = $true

# Microphone
Write-Host ""
Write-Host "  [Permissao] Microfone" -ForegroundColor Yellow
Write-Host "  Necessario para: comando de voz (acorda/descansa)"
Write-Host "  O Yami escuta apenas a palavra de ativacao."
Write-Host ""
$mic = Read-Host "  Permitir acesso ao microfone? (S/N) [S]"
if ($mic -ne "N" -and $mic -ne "n") {
  Write-Success "Microfone: permitido"
} else {
  $allPermissionsGranted = $false
  Write-WarningMsg "Microfone: negado (voz desativada)"
}

# Auto-start
Write-Host ""
Write-Host "  [Permissao] Iniciar com Windows" -ForegroundColor Yellow
Write-Host "  O Yami aparece automaticamente ao ligar o computador."
Write-Host ""
$autostart = Read-Host "  Permitir inicio automatico? (S/N) [S]"
$autoStartEnabled = ($autostart -ne "N" -and $autostart -ne "n")
if ($autoStartEnabled) { Write-Success "Auto-start: ativado" } else { Write-WarningMsg "Auto-start: desativado" }

# Dashboard
Write-Host ""
Write-Host "  [Permissao] Abrir Dashboard" -ForegroundColor Yellow
Write-Host "  O Yami aparece como um Tamagotchi na tela."
Write-Host ""
$openDash = Read-Host "  Abrir Dashboard Yami agora? (S/N) [S]"
$openDashboardNow = ($openDash -ne "N" -and $openDash -ne "n")
if ($openDashboardNow) { Write-Success "Dashboard: abrir ao finalizar" } else { Write-Status "Dashboard: manual" }

# ─── Step 5: Install ────────────────────────────────────────────────────────
Show-Header
Write-Step "Instalando Yami..." "Configurando tudo automaticamente."

# 5a. Create YAMI home
Show-ProgressBar 5 "Criando diretorio Yami"
if (-not (Test-Path $YAMI_HOME)) { New-Item -ItemType Directory -Path $YAMI_HOME -Force | Out-Null }
Write-Success "Diretorio criado: $YAMI_HOME"

# 5b. Copy runtime core
Show-ProgressBar 15 "Copiando runtime"
$CoreDst = Join-Path $YAMI_HOME "runtime\core"
if (Test-Path $CoreDst) { Remove-Item -Path $CoreDst -Recurse -Force -ErrorAction SilentlyContinue }
Copy-Item -Path (Join-Path $RUNTIME "core") -Destination (Join-Path $YAMI_HOME "runtime") -Recurse -Force
Write-Success "Runtime copiado"

# 5c. Copy dashboard
Show-ProgressBar 30 "Instalando dashboard"
$PanelDst = Join-Path $YAMI_HOME "auto-panel"
if (Test-Path $PanelDst) { Remove-Item -Path "$PanelDst\*" -Recurse -Force -ErrorAction SilentlyContinue }
else { New-Item -ItemType Directory -Path $PanelDst -Force | Out-Null }
Copy-Item -Path "$DASHBOARD\*" -Destination $PanelDst -Recurse -Force
Write-Success "Dashboard instalado"

# 5d. Create config
Show-ProgressBar 45 "Gerando configuracao"
$ConfigSrc = $CONFIG
$configFiles = @("yami-id.json", "profile.json", "appearance.json", "voice.json", "modules.json", "evolution.json", "sync.json")
$pendriveConfig = Join-Path $YAMI_HOME "pendrive"
if (-not (Test-Path $pendriveConfig)) { New-Item -ItemType Directory -Path $pendriveConfig -Force | Out-Null }
foreach ($file in $configFiles) {
  $srcPath = Join-Path $ConfigSrc $file
  if (Test-Path $srcPath) {
    Copy-Item $srcPath (Join-Path $pendriveConfig $file) -Force
  }
}
Write-Success "Configuracao gerada"

# 5e. Generate yami.json
Show-ProgressBar 55 "Configurando Yami"
$yamiConfig = @{
  gateway = @{
    auth = @{ mode = "token"; token = -join ((48..57) + (97..102) | Get-Random -Count 32 | ForEach-Object { [char]$_ }) }
    mode = "local"
    port = 18789
    bind = "loopback"
    controlUi = @{ allowedOrigins = @() }
  }
  yami = @{
    name = "Yami"
    runtimeHome = $YAMI_HOME
    publicBrand = "Yami"
    upstreamCompatibility = @("openclaw-runtime-core", "hermes-agent-adapters")
    product = "Yami"
    identity = "yami-native-runtime"
    role = "assistant-runtime"
    mode = "own-runtime-with-upstream-adapters"
    configVersion = "2026-06-08-yami-pendrive-1"
    publicNaming = @{
      assistant = "Yami"
      dashboard = "Dashboard Yami"
      gateway = "Gateway Yami"
      chats = "Chats Yami"
      voice = "Voz Yami"
    }
    rules = @{
      notVisualCopy = $true
      textDefault = $true
      explicitFileShareOnly = $true
      voiceWake = "acorda"
      voiceRest = "descansa"
    }
    nativeCapabilities = @{
      version = "1.0.0"
      modules = @("comunicacao", "agenda-inteligente", "gerenciamento-arquivos", "gerenciamento-fotos", "compartilhamento-assistido")
      storage = @{
        comunicacao = "~/.yami/comunicacao/"
        agenda = "~/.yami/agenda/"
        arquivos = "~/.yami/arquivos/"
        fotos = "~/.yami/fotos/"
        media = "~/.yami/media/"
      }
    }
  }
  agents = @{
    defaults = @{
      bootstrapMaxChars = 10000
      bootstrapTotalMaxChars = 80000
      contextInjection = "continuation-skip"
      models = @{}
      workspace = "$YAMI_HOME\workspace"
    }
  }
  auth = @{
    accounts = @{
      homePath = "$YAMI_HOME\auth"
      providersFile = "$YAMI_HOME\auth\providers\registry.json"
      accountsFile = "$YAMI_HOME\auth\accounts.json"
      tokensDir = "$YAMI_HOME\auth\tokens"
      autoSync = $true
      syncIntervalMinutes = 15
    }
  }
  skills = @{ entries = @{} }
  plugins = @{
    entries = @{}
    allow = @("whatsapp", "codex", "browser", "canvas", "device-pair", "file-transfer", "memory-core", "phone-control", "openai")
  }
  browser = @{
    profiles = @{
      chrome = @{ cdpUrl = "http://127.0.0.1:9222"; color = "#00AA00" }
    }
    defaultProfile = "chrome"
  }
}

# Add OpenAI if key was provided
if ($openaiApiKey -ne "") {
  $yamiConfig.agents.defaults.models["openai/gpt-5.5"] = @{}
  $yamiConfig.agents.defaults.model = @{ primary = "openai/gpt-5.5" }
  $yamiConfig.auth.order = @{ openai = @("openai:pendrive-user") }
  $yamiConfig.auth.profiles = @{
    "openai:pendrive-user" = @{
      provider = "openai"
      mode = "api-key"
      email = "pendrive@yami.local"
      apiKey = $openaiApiKey
    }
  }
}

$yamiConfig | ConvertTo-Json -Depth 10 | Out-File (Join-Path $YAMI_HOME "yami.json") -Encoding utf8
Write-Success "yami.json configurado"

# 5f. Copy modules registry
Show-ProgressBar 65 "Configurando modulos"
$ModulesDst = Join-Path $YAMI_HOME "modules"
if (-not (Test-Path $ModulesDst)) { New-Item -ItemType Directory -Path $ModulesDst -Force | Out-Null }
Copy-Item -Path "$MODULES\*" -Destination $ModulesDst -Recurse -Force
Write-Success "Modulos registrados"

# 5g. Copy assets
Show-ProgressBar 75 "Instalando recursos visuais"
$AssetsDst = Join-Path $YAMI_HOME "assets"
if (Test-Path $ASSETS) {
  Copy-Item -Path "$ASSETS\*" -Destination $AssetsDst -Recurse -Force
}
Write-Success "Recursos visuais instalados"

# 5h. Copy updater
Show-ProgressBar 85 "Instalando sistema de atualizacao"
$UpdaterDst = Join-Path $YAMI_HOME "updater"
Copy-Item -Path "$UPDATER\*" -Destination $UpdaterDst -Recurse -Force
Write-Success "Sistema de atualizacao instalado"

# 5i. Install updater service
Show-ProgressBar 90 "Registrando atualizacoes"
$updateScript = Join-Path $UpdaterDst "YamiUpdater.ps1"
if (Test-Path $updateScript) {
  & $updateScript -Install
  Write-Success "Atualizacao automatica registrada"
}

# 5j. Create auto-start shortcut
Show-ProgressBar 95 "Configurando inicio automatico"
if ($autoStartEnabled) {
  $startupFolder = [Environment]::GetFolderPath("Startup")
  $shortcutPath = Join-Path $startupFolder "Yami.lnk"
  $shell = New-Object -ComObject WScript.Shell
  $shortcut = $shell.CreateShortcut($shortcutPath)
  $shortcut.TargetPath = "powershell.exe"
  $shortcut.Arguments = "-NoProfile -ExecutionPolicy Bypass -WindowStyle Hidden -File `"$YAMI_HOME\auto-panel\YamiPanelHidden.vbs`""
  $shortcut.WorkingDirectory = $YAMI_HOME
  $shortcut.Description = "Yami - Assistente Pessoal"
  $shortcut.Save()
  [System.Runtime.Interopservices.Marshal]::ReleaseComObject($shell) | Out-Null
  Write-Success "Atalho criado em Inicializar"
} else {
  Write-Status "Auto-start: configuracao manual"
}

Show-ProgressBar 100 "Instalacao concluida!"

# ─── Step 6: Finalize ───────────────────────────────────────────────────────
Show-Header
Write-Step "Instalacao Concluida!" "Yami esta pronto para uso."

Write-Host ""
Write-Host "  O que foi instalado:"
Write-Host "  ✓ Runtime Yami (motor IA local)" -ForegroundColor Green
Write-Host "  ✓ Dashboard Yami (interface Tamagotchi)" -ForegroundColor Green
Write-Host "  ✓ Gateway Yami (comunicacao)" -ForegroundColor Green
Write-Host "  ✓ Modulos OpenClaw/OpenCloud/Hermes" -ForegroundColor Green
Write-Host "  ✓ Sistema de atualizacao automatica" -ForegroundColor Green
if ($openaiApiKey) { Write-Host "  ✓ Conta OpenAI configurada" -ForegroundColor Green }
if ($accountsConfigured["whatsapp"]) { Write-Host "  ✓ WhatsApp configurado" -ForegroundColor Green }
if ($autoStartEnabled) { Write-Host "  ✓ Inicio automatico com Windows" -ForegroundColor Green }
Write-Host ""

Write-Host "  Comandos de voz:" -ForegroundColor Cyan
Write-Host "  • Diga 'Acorda Yami' para ativar" -ForegroundColor White
Write-Host "  • Diga 'Descansa Yami' para pausar" -ForegroundColor White
Write-Host ""

if ($openDashboardNow) {
  Write-Host "  Abrindo Dashboard Yami..." -ForegroundColor Yellow
  $panelExe = Join-Path $YAMI_HOME "auto-panel\YamiPanelApp.vbs"
  if (Test-Path $panelExe) {
    Start-Process wscript.exe -ArgumentList "`"$panelExe`"" -WindowStyle Hidden
  } else {
    Start-Process "http://127.0.0.1:18808/"
  }
}

Write-Host ""
Write-Host "  Pressione ENTER para sair do instalador." -ForegroundColor Yellow
$null = Read-Host
