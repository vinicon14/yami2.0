# YAMI Pendrive Launcher
# Single-click start: launches everything needed for YAMI
$Host.UI.RawUI.WindowTitle = "Yami"

$YAMI_HOME = Join-Path $env:USERPROFILE ".yami"
$PANEL_JS  = Join-Path $YAMI_HOME "auto-panel\server.js"

# Start the panel server if not running
$portCheck = netstat -an | Select-String "127.0.0.1:18808"
if (-not $portCheck) {
  Start-Process powershell.exe -ArgumentList "-NoProfile -ExecutionPolicy Bypass -WindowStyle Hidden -Command `"node \`"$PANEL_JS\`"`"" -WindowStyle Hidden
  Start-Sleep -Milliseconds 1500
}

# Open dashboard
Start-Process "http://127.0.0.1:18808/?voice=1"
