# Ralph Wiggum Loop for Nestly
# An iterative improvement system where Claude continuously improves the dashboard
# until completion criteria are met.
#
# Usage: .\scripts\ralph-loop.ps1 [-MaxIterations 10] [-Verbose]

param(
    [int]$MaxIterations = 10,
    [switch]$Verbose
)

$ErrorActionPreference = "Continue"
$scriptDir = Split-Path -Parent $MyInvocation.MyCommand.Path
$projectDir = Split-Path -Parent $scriptDir

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "  Ralph Wiggum Iteration Loop" -ForegroundColor Cyan
Write-Host "  Nestly Family Dashboard" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "Max Iterations: $MaxIterations" -ForegroundColor Yellow
Write-Host "Project Dir: $projectDir" -ForegroundColor Yellow
Write-Host ""

# Change to project directory
Set-Location $projectDir

$iteration = 0
$startTime = Get-Date

while ($iteration -lt $MaxIterations) {
    $iteration++
    $iterationStart = Get-Date

    Write-Host ""
    Write-Host "========================================" -ForegroundColor Green
    Write-Host "  Iteration $iteration of $MaxIterations" -ForegroundColor Green
    Write-Host "  Started: $(Get-Date -Format 'HH:mm:ss')" -ForegroundColor Green
    Write-Host "========================================" -ForegroundColor Green
    Write-Host ""

    # Feed prompt to Claude Code
    # Using 'claude' CLI with the prompt file as input
    try {
        $promptContent = Get-Content "RALPH-PROMPT.md" -Raw

        if ($Verbose) {
            Write-Host "Sending prompt to Claude..." -ForegroundColor Gray
        }

        # Pipe the prompt to Claude Code CLI
        $promptContent | claude

        $exitCode = $LASTEXITCODE

        if ($Verbose) {
            Write-Host "Claude exited with code: $exitCode" -ForegroundColor Gray
        }
    }
    catch {
        Write-Host "Error invoking Claude: $_" -ForegroundColor Red
        Write-Host "Continuing to next iteration..." -ForegroundColor Yellow
        Start-Sleep -Seconds 5
        continue
    }

    # Check for completion promise in progress.txt
    $progressFile = Join-Path $projectDir "progress.txt"

    if (Test-Path $progressFile) {
        $progressContent = Get-Content $progressFile -Raw

        if ($progressContent -match "ITERATION_COMPLETE") {
            Write-Host ""
            Write-Host "========================================" -ForegroundColor Green
            Write-Host "  SUCCESS! Iteration Complete" -ForegroundColor Green
            Write-Host "========================================" -ForegroundColor Green

            $totalTime = (Get-Date) - $startTime
            Write-Host ""
            Write-Host "Total iterations: $iteration" -ForegroundColor Cyan
            Write-Host "Total time: $($totalTime.ToString('hh\:mm\:ss'))" -ForegroundColor Cyan
            Write-Host ""

            # Display final progress summary
            Write-Host "Final Progress:" -ForegroundColor Yellow
            Write-Host "----------------------------------------"
            Get-Content $progressFile

            break
        }

        # Count improvements made so far
        $improvementCount = ([regex]::Matches($progressContent, "### Improvement \d+")).Count
        Write-Host "Improvements completed so far: $improvementCount" -ForegroundColor Cyan
    }

    $iterationTime = (Get-Date) - $iterationStart
    Write-Host ""
    Write-Host "Iteration $iteration completed in $($iterationTime.ToString('mm\:ss'))" -ForegroundColor Gray
    Write-Host "Continuing to next iteration in 2 seconds..." -ForegroundColor Gray
    Start-Sleep -Seconds 2
}

if ($iteration -ge $MaxIterations) {
    Write-Host ""
    Write-Host "========================================" -ForegroundColor Yellow
    Write-Host "  Max iterations reached ($MaxIterations)" -ForegroundColor Yellow
    Write-Host "========================================" -ForegroundColor Yellow
    Write-Host ""
    Write-Host "The loop completed $MaxIterations iterations without reaching completion criteria."
    Write-Host "Check progress.txt for current status."
}

$totalTime = (Get-Date) - $startTime
Write-Host ""
Write-Host "Total runtime: $($totalTime.ToString('hh\:mm\:ss'))" -ForegroundColor Cyan
