#!/usr/bin/env pwsh
# Yami MVP Launcher - PowerShell Wrapper
# This script launches the Yami local assistant runtime

$ErrorActionPreference = 'Stop'

# Set environment variables
$env:YAMI_HOME = if ($env:YAMI_HOME) { $env:YAMI_HOME } else { "$env:USERPROFILE\.yami" }
$env:YAMI_CONFIG_PATH = "$env:YAMI_HOME\yami.json"
$env:OPENCLAW_HOME = $env:YAMI_HOME
$env:OPENCLAW_CONFIG_PATH = $env:YAMI_CONFIG_PATH
$env:OPENCLAW_STATE_DIR = $env:YAMI_HOME

# Get the path to yami.mjs
$yamiMjs = "$env:YAMI_HOME\runtime\core\yami.mjs"

# Verify the runtime file exists
if (-not (Test-Path -LiteralPath $yamiMjs)) {
    Write-Error "Yami runtime not found at: $yamiMjs"
    exit 1
}

# Launch the runtime
& node $yamiMjs @args
$exitCode = $LASTEXITCODE

exit $exitCode
