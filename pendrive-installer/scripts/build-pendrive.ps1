param(
  [string]$OutputPath = "C:\Users\vinim\.yami\pendrive-installer",
  [string]$UsbDrive = "",
  [switch]$DeployToUsb
)

Write-Output "=== YAMI Pendrive Builder ==="
Write-Output ""

$ErrorActionPreference = "Stop"
$YamiHome = $env:USERPROFILE + "\.yami"
$SourceDir = $YamiHome

# Ensure we're running from YAMI home
if (-not (Test-Path $SourceDir)) {
  Write-Error "YAMI home not found at $SourceDir"
  exit 1
}

Write-Output "[1/8] Assembling runtime core..."
$CoreSrc = "$SourceDir\runtime\core"
$CoreDst = "$OutputPath\runtime\core"
if (Test-Path $CoreSrc) {
  Copy-Item -Path "$CoreSrc\*" -Destination $CoreDst -Recurse -Force -Exclude @("node_modules", ".git")
  Write-Output "  -> Runtime core copied"
}

Write-Output "[2/8] Bundling Node.js portable..."
$NodeDir = "$OutputPath\runtime\node"
$nodeExe = Get-Command "node.exe" -ErrorAction SilentlyContinue
if ($nodeExe) {
  $nodePath = $nodeExe.Source
  Copy-Item $nodePath "$NodeDir\node.exe" -Force
  Write-Output "  -> node.exe bundled"
} else {
  Write-Warning "  -> node.exe not found. User will need Node.js installed."
}

Write-Output "[3/8] Copying dependencies..."
$DepsDst = "$OutputPath\runtime\deps"
$possibleDeps = @("npm-shrinkwrap.json", "package.json", "pnpm-workspace.yaml")
foreach ($dep in $possibleDeps) {
  $srcFile = "$CoreSrc\$dep"
  if (Test-Path $srcFile) {
    Copy-Item $srcFile "$DepsDst\" -Force
  }
}
Write-Output "  -> Dependency manifests copied"

Write-Output "[4/8] Bundling auto-panel (dashboard + Tamagotchi)..."
$PanelSrc = "$SourceDir\auto-panel"
$PanelDst = "$OutputPath\dashboard"
if (Test-Path $PanelSrc) {
  Copy-Item -Path "$PanelSrc\*" -Destination $PanelDst -Recurse -Force -Exclude @("node_modules")
  Write-Output "  -> Dashboard copied"
}

Write-Output "[5/8] Creating assets..."
$AssetDir = "$OutputPath\assets\tamagotchi"
# Yami icon (placeholder - will be a proper .ico in production)
@"
YAMI_TAMAGOTCHI_ASSETS
"@ | Out-File "$AssetDir\ASSETS.md" -Encoding utf8
Write-Output "  -> Asset placeholders created"

Write-Output "[6/8] Generating configuration profiles..."
$ConfigDir = "$OutputPath\config"
$profiles = Get-ChildItem "$SourceDir\pendrive" -Filter "*.json"
foreach ($profile in $profiles) {
  Copy-Item $profile.FullName "$ConfigDir\" -Force
}
Write-Output "  -> Configuration profiles copied"

Write-Output "[7/8] Building modules registry..."
$ModulesDir = "$OutputPath\modules"
@{
  openclaw = @{
    version = "1.0.0"
    source = "openclaw-runtime-core"
    adapted = $true
    modules = @("gateway", "agent", "skills", "auth")
  }
  opencloud = @{
    version = "1.0.0"
    source = "opencloud-sync"
    adapted = $true
    modules = @("sync", "identity", "storage")
  }
  hermes = @{
    version = "1.0.0"
    source = "hermes-agent-adapters"
    adapted = $true
    modules = @("voice", "memory", "permissions", "agent-ergonomics")
  }
} | ConvertTo-Json -Depth 10 | Out-File "$ModulesDir\registry.json" -Encoding utf8
Write-Output "  -> Module registry created"

Write-Output "[8/8] Finalizing installer..."
$InstallerDir = "$OutputPath\installer"
$installerFiles = @("YamiInstaller.ps1", "YamiSetupWizard.exe")
foreach ($file in $installerFiles) {
  $path = "$InstallerDir\$file"
  if (Test-Path $path) {
    Write-Output "  -> $file ready"
  } else {
    Write-Warning "  -> $file not yet compiled"
  }
}

Write-Output ""
Write-Output "=== Build complete ==="
Write-Output "Output: $OutputPath"
Write-Output ""

if ($DeployToUsb -and $UsbDrive) {
  if (Test-Path $UsbDrive) {
    Write-Output "Deploying to USB: $UsbDrive"
    Copy-Item -Path "$OutputPath\*" -Destination $UsbDrive -Recurse -Force
    Write-Output "Deploy complete!"
  } else {
    Write-Error "USB drive not found at $UsbDrive"
  }
}
