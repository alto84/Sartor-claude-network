# Ralph Completion Check Hook
# Runs after tool uses to check if iteration is complete
# Exit codes: 0 = continue, 1 = stop (completion detected)

param(
    [string]$ToolName,
    [string]$Args
)

$scriptDir = Split-Path -Parent $MyInvocation.MyCommand.Path
$projectDir = Split-Path -Parent $scriptDir
$progressFile = Join-Path $projectDir "progress.txt"

# Check if progress.txt exists
if (-not (Test-Path $progressFile)) {
    exit 0
}

# Read progress file
$content = Get-Content $progressFile -Raw

# Check for completion promise
if ($content -match "<promise>ITERATION_COMPLETE</promise>") {
    Write-Host "[RALPH] Completion detected! Iteration loop should stop." -ForegroundColor Green
    exit 1
}

# Count improvements
$improvementCount = ([regex]::Matches($content, "### Improvement \d+")).Count
$requiredImprovements = 5

if ($improvementCount -ge $requiredImprovements) {
    Write-Host "[RALPH] $improvementCount improvements completed. Ready for completion check." -ForegroundColor Yellow
}

exit 0
