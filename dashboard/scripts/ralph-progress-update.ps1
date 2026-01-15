# Ralph Progress Update Hook
# Automatically updates progress.txt with file changes
# Called after Edit/Write operations

param(
    [string]$ToolName,
    [string]$FilePath
)

$scriptDir = Split-Path -Parent $MyInvocation.MyCommand.Path
$projectDir = Split-Path -Parent $scriptDir
$progressFile = Join-Path $projectDir "progress.txt"

# Only track dashboard-related files
if ($FilePath -notlike "*dashboard*") {
    exit 0
}

$timestamp = Get-Date -Format "yyyy-MM-dd HH:mm:ss"
$fileName = Split-Path -Leaf $FilePath

# Log the change (but don't auto-create improvements - that's Claude's job)
$logEntry = "[$timestamp] $ToolName: $fileName"

# We could append to a separate log file for debugging
# Add-Content -Path (Join-Path $projectDir "ralph-changes.log") -Value $logEntry

exit 0
