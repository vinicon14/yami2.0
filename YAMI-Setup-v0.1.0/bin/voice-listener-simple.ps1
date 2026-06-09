param([switch]$Verbose)

Write-Host "" -ForegroundColor Cyan
Write-Host "YAMI Voice Recognition Service v0.1.0" -ForegroundColor Cyan
Write-Host "" -ForegroundColor Cyan
Write-Host "Listening for voice commands..." -ForegroundColor Yellow
Write-Host "" -ForegroundColor Yellow
Write-Host "Commands:" -ForegroundColor White
Write-Host "  - acorda / acordar   (Start YAMI)" -ForegroundColor White
Write-Host "  - descansa / descansar  (Stop YAMI)" -ForegroundColor White
Write-Host "" -ForegroundColor White
Write-Host "Press Ctrl+C to stop" -ForegroundColor Gray
Write-Host "" -ForegroundColor Gray

try {
    Add-Type -AssemblyName System.Speech
    $recognizer = New-Object System.Speech.Recognition.SpeechRecognitionEngine
    $recognizer.SetInputToDefaultAudioDevice()
    
    $grammar = New-Object System.Speech.Recognition.GrammarBuilder
    $choices = New-Object System.Speech.Recognition.Choices
    
    foreach ($word in @("acorda", "acordar", "descansa", "descansar")) {
        $choices.Add($word)
    }
    
    $grammar.Append($choices)
    $recognitionGrammar = New-Object System.Speech.Recognition.Grammar($grammar)
    $recognizer.LoadGrammar($recognitionGrammar)
    
    while ($true) {
        try {
            $result = $recognizer.Recognize()
            
            if ($result -and $result.Confidence -gt 0.5) {
                $text = $result.Text.ToLower().Trim()
                Write-Host ""
                Write-Host "Command detected: $text" -ForegroundColor Green
                Write-Host ""
                
                if ($text -match "acorda|acordar") {
                    Write-Host "Starting YAMI..." -ForegroundColor Yellow
                    
                    $yamiCmd = "C:\Program Files\YAMI\bin\yami.cmd"
                    if (Test-Path $yamiCmd) {
                        Start-Process cmd -ArgumentList "/k $yamiCmd"
                        Write-Host "YAMI started!" -ForegroundColor Green
                    }
                }
                elseif ($text -match "descansa|descansar") {
                    Write-Host "Stopping YAMI..." -ForegroundColor Yellow
                    
                    Get-Process -Name cmd -ErrorAction SilentlyContinue | 
                        Where-Object { $_.MainWindowTitle -like "*YAMI*" } | 
                        ForEach-Object { $_.Kill() }
                    
                    Write-Host "YAMI stopped!" -ForegroundColor Green
                }
                
                Write-Host ""
                Write-Host "Listening for more commands..." -ForegroundColor Cyan
                Write-Host ""
            }
        }
        catch {
            # Timeout, continue listening
        }
    }
}
catch {
    Write-Host "Error: $_" -ForegroundColor Red
    exit 1
}
