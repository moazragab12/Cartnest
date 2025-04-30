# PowerShell script for managing database operations similar to Laravel commands
# Usage: .\db.ps1 [command]

# Define the function to show usage
function Show-Usage {
    Write-Host "Usage: .\db.ps1 [command]"
    Write-Host "Available commands: migrate, seed, refresh, fresh, truncate"
    exit
}

# Check if command is provided
if ($args.Count -eq 0) {
    Show-Usage
}

# Get the command
$command = $args[0]

# Get the directory of the current script
$scriptDir = Split-Path -Path $MyInvocation.MyCommand.Definition -Parent
# Move to the backend directory
Set-Location -Path (Join-Path -Path $scriptDir -ChildPath "..")

# Valid commands
$validCommands = @("migrate", "seed", "refresh", "fresh", "truncate")

# Check if the command is valid
if ($validCommands -contains $command) {
    # Run the appropriate command
    python database/seeders/refresh_db.py $command
}
else {
    Write-Host "Unknown command: $command"
    Show-Usage
}