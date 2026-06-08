param(
  [string]$UsbDrive,
  [switch]$Format,
  [string]$Label = "YAMI"
)

$ErrorActionPreference = "Stop"
$Source = "C:\Users\vinim\.yami\pendrive-installer"

if (-not $UsbDrive) {
  Write-Host "Yami - Deploy para Pendrive" -ForegroundColor Cyan
  Write-Host ""

  $drives = Get-WmiObject Win32_LogicalDisk | Where-Object { $_.DriveType -eq 2 }
  if ($drives.Count -eq 0) {
    Write-Error "Nenhum pendrive detectado. Conecte um pendrive e tente novamente."
    exit 1
  }

  Write-Host "Pendrives detectados:" -ForegroundColor White
  $i = 0
  $drives | ForEach-Object {
    $i++
    $freeGB = [math]::Round($_.FreeSpace / 1GB, 1)
    $totalGB = [math]::Round($_.Size / 1GB, 1)
    Write-Host "  [$i] $($_.DeviceID) - ${freeGB}GB livre / ${totalGB}GB total"
  }

  $choice = Read-Host "Selecione o numero do pendrive (ou digite a letra, ex: E:)"
  if ($choice -match '^\d+$') {
    $idx = [int]$choice - 1
    if ($idx -ge 0 -and $idx -lt $drives.Count) {
      $UsbDrive = $drives[$idx].DeviceID
    } else {
      Write-Error "Selecao invalida"
      exit 1
    }
  } elseif ($choice -match '^[A-Za-z]:$') {
    $UsbDrive = $choice.ToUpper()
  } else {
    Write-Error "Entrada invalida: $choice"
    exit 1
  }
}

if (-not (Test-Path $UsbDrive)) {
  Write-Error "Pendrive nao encontrado: $UsbDrive"
  exit 1
}

Write-Host "`nDeploying Yami para $UsbDrive ..." -ForegroundColor Cyan

$requiredSize = 500MB
$driveInfo = Get-WmiObject Win32_LogicalDisk -Filter "DeviceID='$UsbDrive'"
if ($driveInfo.FreeSpace -lt $requiredSize) {
  Write-Error "Espaco insuficiente. Necessario: 500MB, Disponivel: $([math]::Round($driveInfo.FreeSpace / 1MB))MB"
  exit 1
}

if ($Format) {
  Write-Host "Formatando $UsbDrive como FAT32 (label: $Label)..." -ForegroundColor Yellow
  & format.com $UsbDrive /FS:FAT32 /V:$Label /Q /Y
  if ($LASTEXITCODE -ne 0) {
    Write-Error "Falha ao formatar"
    exit 1
  }
  Write-Host "Formatado!" -ForegroundColor Green
}

Write-Host "Copiando arquivos..." -ForegroundColor Cyan
$exclude = @("*.ps1", "*.bat", "*.sed")
Copy-Item -Path "$Source\*" -Destination $UsbDrive -Recurse -Force -Exclude $exclude
Copy-Item -Path "$Source\autorun.inf" -Destination $UsbDrive -Force
Copy-Item -Path "$Source\VERSION" -Destination $UsbDrive -Force

Write-Host ""
Write-Host "Verificando integridade..." -ForegroundColor Yellow
$filesCopied = (Get-ChildItem -Path $UsbDrive -Recurse -File | Measure-Object).Count
$sizeCopied = (Get-ChildItem -Path $UsbDrive -Recurse | Measure-Object -Property Length -Sum).Sum
Write-Host "  Arquivos copiados: $filesCopied" -ForegroundColor White
Write-Host "  Tamanho total: $([math]::Round($sizeCopied / 1MB))MB" -ForegroundColor White

Write-Host ""
Write-Host "=== Deploy concluido! ===" -ForegroundColor Green
Write-Host "Pendrive Yami pronto em: $UsbDrive" -ForegroundColor White
Write-Host "Remova o pendrive com seguranca e conecte em qualquer computador." -ForegroundColor White
Write-Host "O instalador abrira automaticamente (autorun)." -ForegroundColor White
