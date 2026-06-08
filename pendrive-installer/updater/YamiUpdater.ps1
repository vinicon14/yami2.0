#requires -version 5.1

<#
.SYNOPSIS
  YAMI Update System - plug-and-play automatic updates
.DESCRIPTION
  Checks for updates from the pendrive or a remote source.
  Can run on schedule or on-demand.
#>

param(
  [switch]$Install,
  [switch]$Check,
  [switch]$Apply,
  [switch]$Force
)

$YAMI_HOME = Join-Path $env:USERPROFILE ".yami"
$UPDATE_DIR = Join-Path $YAMI_HOME "updater"
$UPDATE_LOG = Join-Path $UPDATE_DIR "update-log.json"
$UPDATE_SOURCE = "https://raw.githubusercontent.com/vinim/yami-updates/main"  # placeholder

# ─── Install update schedule ─────────────────────────────────────────────────
if ($Install) {
  Write-Host "[Yami Updater] Instalando rotina de atualizacao..." -ForegroundColor Cyan

  # Create scheduled task for weekly updates
  $taskName = "Yami-WeeklyUpdate"
  $existing = Get-ScheduledTask -TaskName $taskName -ErrorAction SilentlyContinue
  if (-not $existing) {
    $action = New-ScheduledTaskAction -Execute "powershell.exe" -Argument "-NoProfile -ExecutionPolicy Bypass -File `"$PSCommandPath`" -Check"
    $trigger = New-ScheduledTaskTrigger -Weekly -DaysOfWeek Sunday -At "03:00"
    $principal = New-ScheduledTaskPrincipal -UserId "SYSTEM" -LogonType ServiceAccount -RunLevel Highest
    Register-ScheduledTask -TaskName $taskName -Action $action -Trigger $trigger -Principal $principal -Description "Yami automatic update check" -Force
    Write-Host "[Yami Updater] Tarefa agendada: toda semana (domingo 03:00)" -ForegroundColor Green
  } else {
    Write-Host "[Yami Updater] Tarefa ja existe" -ForegroundColor Yellow
  }

  # Create startup trigger
  $startupTaskName = "Yami-StartupCheck"
  $existingStartup = Get-ScheduledTask -TaskName $startupTaskName -ErrorAction SilentlyContinue
  if (-not $existingStartup) {
    $action = New-ScheduledTaskAction -Execute "powershell.exe" -Argument "-NoProfile -ExecutionPolicy Bypass -File `"$PSCommandPath`" -Check"
    $trigger = New-ScheduledTaskTrigger -AtStartup -RandomDelay (New-TimeSpan -Minutes 5)
    $principal = New-ScheduledTaskPrincipal -UserId "SYSTEM" -LogonType ServiceAccount -RunLevel Highest
    Register-ScheduledTask -TaskName $startupTaskName -Action $action -Trigger $trigger -Principal $principal -Description "Yami startup update check" -Force
    Write-Host "[Yami Updater] Verificacao ao iniciar agendada" -ForegroundColor Green
  }

  # Save install manifest
  @{
    installedAt = (Get-Date).ToString("o")
    version = "1.0.0-pendrive"
    updaterVersion = "1.0"
    schedule = "weekly"
    lastCheck = $null
    lastUpdate = $null
  } | ConvertTo-Json | Out-File $UPDATE_LOG -Encoding utf8

  return
}

# ─── Check for updates ───────────────────────────────────────────────────────
if ($Check -or $Force) {
  Write-Host "[Yami Updater] Verificando atualizacoes..." -ForegroundColor Cyan

  $manifest = $null
  if (Test-Path $UPDATE_LOG) {
    try { $manifest = Get-Content $UPDATE_LOG -Raw | ConvertFrom-Json } catch {}
  }

  # Check local pendrive updates
  $pendriveMarker = Join-Path (Split-Path $YAMI_HOME -Parent) "pendrive-installer"
  $pendriveUpdate = $null
  if (Test-Path $pendriveMarker) {
    $updateVersionFile = Join-Path $pendriveMarker "VERSION"
    if (Test-Path $updateVersionFile) {
      $pendriveUpdate = Get-Content $updateVersionFile -Raw -ErrorAction SilentlyContinue
    }
  }

  # Check remote update source (GitHub)
  $remoteVersion = $null
  try {
    $remoteVersion = (Invoke-WebRequest -Uri "$UPDATE_SOURCE/VERSION" -UseBasicParsing -TimeoutSec 5).Content.Trim()
  } catch {
    Write-Host "[Yami Updater] Sem conexao remota (offline)" -ForegroundColor Gray
  }

  $currentVersion = if ($manifest) { $manifest.version } else { "0.0.0" }
  $updateAvailable = $false
  $updateSource = ""

  if ($pendriveUpdate -and $pendriveUpdate.Trim() -ne $currentVersion) {
    $updateAvailable = $true
    $updateSource = "pendrive"
    Write-Host "[Yami Updater] Atualizacao disponivel no pendrive: $($pendriveUpdate.Trim())" -ForegroundColor Yellow
  }

  if ($remoteVersion -and $remoteVersion.Trim() -ne $currentVersion) {
    $updateAvailable = $true
    $updateSource = "remote"
    Write-Host "[Yami Updater] Atualizacao remota disponivel: $($remoteVersion.Trim())" -ForegroundColor Yellow
  }

  if (-not $updateAvailable) {
    Write-Host "[Yami Updater] Yami esta atualizado (v$currentVersion)" -ForegroundColor Green
  }

  # Update manifest
  if ($manifest) {
    $manifest.lastCheck = (Get-Date).ToString("o")
    $manifest | ConvertTo-Json | Out-File $UPDATE_LOG -Encoding utf8
  }

  if ($updateAvailable -and $Apply) {
    Write-Host "[Yami Updater] Aplicando atualizacao..." -ForegroundColor Cyan

    if ($updateSource -eq "pendrive") {
      # Apply from pendrive
      $sourceDir = Join-Path $pendriveMarker "runtime"
      $targetDir = Join-Path $YAMI_HOME "runtime"
      if (Test-Path $sourceDir) {
        Copy-Item -Path "$sourceDir\*" -Destination $targetDir -Recurse -Force
        Write-Host "[Yami Updater] Runtime atualizado do pendrive" -ForegroundColor Green
      }

      $sourcePanel = Join-Path $pendriveMarker "dashboard"
      $targetPanel = Join-Path $YAMI_HOME "auto-panel"
      if (Test-Path $sourcePanel) {
        Copy-Item -Path "$sourcePanel\*" -Destination $targetPanel -Recurse -Force
        Write-Host "[Yami Updater] Dashboard atualizado do pendrive" -ForegroundColor Green
      }
    }

    if ($updateSource -eq "remote") {
      # Download and apply from remote
      try {
        $tempDir = Join-Path $env:TEMP "yami-update"
        New-Item -ItemType Directory -Path $tempDir -Force | Out-Null

        Invoke-WebRequest -Uri "$UPDATE_SOURCE/runtime-core.zip" -OutFile (Join-Path $tempDir "runtime-core.zip") -UseBasicParsing
        Expand-Archive -Path (Join-Path $tempDir "runtime-core.zip") -DestinationPath (Join-Path $YAMI_HOME "runtime") -Force

        Invoke-WebRequest -Uri "$UPDATE_SOURCE/dashboard.zip" -OutFile (Join-Path $tempDir "dashboard.zip") -UseBasicParsing
        Expand-Archive -Path (Join-Path $tempDir "dashboard.zip") -DestinationPath (Join-Path $YAMI_HOME "auto-panel") -Force

        Remove-Item -Path $tempDir -Recurse -Force -ErrorAction SilentlyContinue
        Write-Host "[Yami Updater] Atualizacao remota aplicada" -ForegroundColor Green
      } catch {
        Write-Host "[Yami Updater] Falha ao baixar atualizacao: $_" -ForegroundColor Red
      }
    }

    # Update manifest
    if ($manifest) {
      $newVersion = if ($pendriveUpdate) { $pendriveUpdate.Trim() } elseif ($remoteVersion) { $remoteVersion.Trim() } else { $currentVersion }
      $manifest.version = $newVersion
      $manifest.lastUpdate = (Get-Date).ToString("o")
      $manifest | ConvertTo-Json | Out-File $UPDATE_LOG -Encoding utf8
    }
  }

  return
}

# ─── Help ────────────────────────────────────────────────────────────────────
Write-Host ""
Write-Host "Yami Updater - Uso:" -ForegroundColor Cyan
Write-Host "  -Install   Instala a rotina de atualizacao automatica" -ForegroundColor White
Write-Host "  -Check     Verifica se ha atualizacoes" -ForegroundColor White
Write-Host "  -Apply     Aplica a atualizacao (usar com -Check)" -ForegroundColor White
Write-Host "  -Force     Forca verificacao mesmo se recente" -ForegroundColor White
Write-Host ""
