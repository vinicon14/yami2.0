#Requires -Version 5.0
<#
.SYNOPSIS
    YAMI Voice Recognition Service - Listens for voice commands
#>

param([switch]$Verbose = $false)

function Show-Banner {
    Write-Host ""
    Write-Host "╔════════════════════════════════════════════╗" -ForegroundColor Cyan
    Write-Host "║  YAMI Voice Recognition Service v0.1.0    ║" -ForegroundColor Cyan
    Write-Host "╚════════════════════════════════════════════╝" -ForegroundColor Cyan
    Write-Host ""
    Write-Host "🎤 Listening for voice commands..." -ForegroundColor Yellow
    Write-Host ""
    Write-Host "Available commands:" -ForegroundColor Cyan
    Write-Host "  • 'acorda' or 'acordar'      - Start YAMI" -ForegroundColor White
    Write-Host "  • 'descansa' or 'descansar'  - Stop YAMI" -ForegroundColor White
    Write-Host ""
    Write-Host "Press Ctrl+C to stop" -ForegroundColor Gray
    Write-Host ""
    Write-Host ("─" * 44) -ForegroundColor Gray
    Write-Host ""
}

function Initialize-SpeechEngine {
    try {
        Add-Type -AssemblyName System.Speech
        $engine = New-Object System.Speech.Recognition.SpeechRecognitionEngine
        $engine.SetInputToDefaultAudioDevice()
        Write-Verbose "Speech engine initialized"
        return $engine
    }
    catch {
        Write-Host "Error initializing speech engine: $_" -ForegroundColor Red
        exit 1
    }
}

function Start-VoiceListener {
    param([object]$Engine)
    
    $grammar = New-Object System.Speech.Recognition.GrammarBuilder
    $choices = New-Object System.Speech.Recognition.Choices
    
    $choices.Add("acorda")
    $choices.Add("acordar")
    $choices.Add("descansa")
    $choices.Add("descansar")
    
    $grammar.Append($choices)
    $recognitionGrammar = New-Object System.Speech.Recognition.Grammar ($grammar)
    $Engine.LoadGrammar($recognitionGrammar)
    
    while ($true) {
        try {
            $result = $Engine.Recognize()
            
            if ($result) {
                $text = $result.Text.ToLower().Trim()
                Write-Verbose "Recognized: $text"
                
                if ($text -match "acorda|acordar") {
                    Invoke-AcordaCommand
                }
                elseif ($text -match "descansa|descansar") {
                    Invoke-DescansaCommand
                }
            }
        }
        catch {
            Write-Verbose "Recognition timeout or error"
        }
    }
}

function Invoke-AcordaCommand {
    Write-Host "✅ Command: ACORDA" -ForegroundColor Green
    Write-Host "🚀 Starting YAMI..." -ForegroundColor Yellow
    
    $running = Get-Process -Name cmd -ErrorAction SilentlyContinue | Where-Object { $_.MainWindowTitle -like "*YAMI*" }
    if ($running) {
        Write-Host "⚠️  YAMI already running!" -ForegroundColor Yellow
        Write-Host ""
        Write-Host "🎤 Listening for more commands..." -ForegroundColor Cyan
        Write-Host ""
        return
    }

    try {
        $yamiCmd = "C:\Program Files\YAMI\bin\yami.cmd"
        if (Test-Path $yamiCmd) {
            Start-Process cmd -ArgumentList "/k $yamiCmd"
            Write-Host "✨ YAMI started!" -ForegroundColor Green
        }
    }
    catch {
        Write-Host "Error: $_" -ForegroundColor Red
    }

    Write-Host ""
    Write-Host "🎤 Listening for more commands..." -ForegroundColor Cyan
    Write-Host ""
}

function Invoke-DescansaCommand {
    Write-Host "✅ Command: DESCANSA" -ForegroundColor Green
    Write-Host "😴 Stopping YAMI..." -ForegroundColor Yellow
    
    try {
        Get-Process -Name cmd -ErrorAction SilentlyContinue | Where-Object { $_.MainWindowTitle -like "*YAMI*" } | ForEach-Object { $_.Kill() }
        Get-Process -Name node -ErrorAction SilentlyContinue | Where-Object { $_.CommandLine -like "*yami*" } | ForEach-Object { $_.Kill() }
        Write-Host "✨ YAMI stopped!" -ForegroundColor Green
    }
    catch {
        Write-Host "Warning: $_" -ForegroundColor Yellow
    }

    Write-Host ""
    Write-Host "🎤 Listening for more commands..." -ForegroundColor Cyan
    Write-Host ""
}

# Main execution
try {
    Show-Banner
    $engine = Initialize-SpeechEngine
    Start-VoiceListener -Engine $engine
}
catch {
    Write-Host "Fatal error: $_" -ForegroundColor Red
    exit 1
}
