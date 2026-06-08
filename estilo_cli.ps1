<# PowerShell wrapper for YAMI Writing Style CLI

Quick reference:
  .\estilo_cli.ps1 status              - Show profile status
  .\estilo_cli.ps1 view-section        - View AI prompt section
  .\estilo_cli.ps1 analyze "text"      - Analyze text
  .\estilo_cli.ps1 update "text"       - Analyze and update profile
  .\estilo_cli.ps1 reset               - Reset profile
  .\estilo_cli.ps1 enable              - Enable system
  .\estilo_cli.ps1 disable             - Disable system
  .\estilo_cli.ps1 edit '{"key":"value"}' - Edit manually
  .\estilo_cli.ps1 help                - Show help
#>

param(
    [Parameter(Position = 0)]
    [string]$Command = "help",
    
    [Parameter(ValueFromRemainingArguments = $true)]
    [string[]]$Args
)

$yamiHome = $env:YAMI_HOME -or (Join-Path $env:USERPROFILE ".yami")
$estiloDir = Join-Path $yamiHome "estilo"
$pythonScript = Join-Path $estiloDir "__main__.py"

# Build Python command with all arguments
$pythonArgs = @("-m", "estilo", $Command)
if ($Args -and $Args.Count -gt 0) {
    $pythonArgs += $Args
}

# Run Python
Push-Location $yamiHome
try {
    python @pythonArgs
}
finally {
    Pop-Location
}
