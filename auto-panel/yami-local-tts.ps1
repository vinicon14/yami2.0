param(
  [string]$Text,
  [string]$OutputPath,
  [string]$Voice = "",
  [int]$Rate = 0,
  [int]$Volume = 100
)

$ErrorActionPreference = "Stop"

if ([string]::IsNullOrWhiteSpace($Text)) {
  $Text = [Console]::In.ReadToEnd()
}

$Text = ($Text -replace "\s+", " ").Trim()
if ([string]::IsNullOrWhiteSpace($Text)) {
  throw "Texto vazio para TTS."
}

if ([string]::IsNullOrWhiteSpace($OutputPath)) {
  throw "OutputPath obrigatorio para TTS."
}

$directory = Split-Path -Parent $OutputPath
if ($directory -and -not (Test-Path -LiteralPath $directory)) {
  New-Item -ItemType Directory -Path $directory -Force | Out-Null
}

Add-Type -AssemblyName System.Speech
$speaker = New-Object System.Speech.Synthesis.SpeechSynthesizer
$speaker.Volume = [Math]::Max(0, [Math]::Min(100, $Volume))
$speaker.Rate = [Math]::Max(-10, [Math]::Min(10, $Rate))

$preferredVoices = @()
if (-not [string]::IsNullOrWhiteSpace($Voice)) {
  $preferredVoices += $Voice
}
$preferredVoices += @(
  "Microsoft Maria Desktop",
  "Microsoft Maria",
  "Microsoft Zira Desktop"
)

foreach ($voiceName in $preferredVoices) {
  try {
    $speaker.SelectVoice($voiceName)
    break
  } catch {}
}

$speaker.SetOutputToWaveFile($OutputPath)
$speaker.Speak($Text)
$speaker.SetOutputToNull()
$speaker.Dispose()
