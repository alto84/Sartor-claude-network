# Quick Start Script for Ralph Wiggum Loop
# Usage: .\scripts\start-ralph.ps1

$scriptDir = Split-Path -Parent $MyInvocation.MyCommand.Path
$projectDir = Split-Path -Parent $scriptDir

Write-Host ""
Write-Host "=====================================" -ForegroundColor Cyan
Write-Host "  Nestly Ralph Wiggum Quick Start" -ForegroundColor Cyan
Write-Host "=====================================" -ForegroundColor Cyan
Write-Host ""

# Change to project directory
Set-Location $projectDir

# Check prerequisites
Write-Host "Checking prerequisites..." -ForegroundColor Yellow

# Check if Claude CLI is available
try {
    $claudeVersion = claude --version 2>&1
    Write-Host "[OK] Claude CLI found" -ForegroundColor Green
}
catch {
    Write-Host "[ERROR] Claude CLI not found. Please install Claude Code." -ForegroundColor Red
    exit 1
}

# Check if dashboard dependencies are installed
if (-not (Test-Path "node_modules")) {
    Write-Host "[WARN] node_modules not found. Installing dependencies..." -ForegroundColor Yellow
    npm install
}
else {
    Write-Host "[OK] Dependencies installed" -ForegroundColor Green
}

# Check if dashboard is running
$dashboardRunning = $false
try {
    $response = Invoke-WebRequest -Uri "http://localhost:3000" -UseBasicParsing -TimeoutSec 2 -ErrorAction SilentlyContinue
    $dashboardRunning = $true
    Write-Host "[OK] Dashboard running at http://localhost:3000" -ForegroundColor Green
}
catch {
    Write-Host "[WARN] Dashboard not running at http://localhost:3000" -ForegroundColor Yellow
    Write-Host "       You may want to start it: npm run dev" -ForegroundColor Yellow
}

# Check required files
$requiredFiles = @(
    "RALPH-PROMPT.md",
    "progress.txt",
    "scripts/ralph-loop.ps1"
)

$allFilesPresent = $true
foreach ($file in $requiredFiles) {
    if (Test-Path $file) {
        Write-Host "[OK] $file" -ForegroundColor Green
    }
    else {
        Write-Host "[MISSING] $file" -ForegroundColor Red
        $allFilesPresent = $false
    }
}

if (-not $allFilesPresent) {
    Write-Host ""
    Write-Host "[ERROR] Some required files are missing. Please ensure all Ralph files are created." -ForegroundColor Red
    exit 1
}

# Show current progress
Write-Host ""
Write-Host "Current Progress:" -ForegroundColor Yellow
Write-Host "=====================================" -ForegroundColor Gray
$progressContent = Get-Content "progress.txt" -Raw
$improvementCount = ([regex]::Matches($progressContent, "### Improvement \d+")).Count
Write-Host "Improvements completed: $improvementCount" -ForegroundColor Cyan
Write-Host ""

# Ask to start
Write-Host "Ready to start Ralph iteration loop?" -ForegroundColor Yellow
Write-Host ""
Write-Host "Options:" -ForegroundColor Gray
Write-Host "  1. Start loop (default 10 iterations)" -ForegroundColor White
Write-Host "  2. Start loop with custom iterations" -ForegroundColor White
Write-Host "  3. Run single iteration (test)" -ForegroundColor White
Write-Host "  4. Exit" -ForegroundColor White
Write-Host ""

$choice = Read-Host "Enter choice (1-4)"

switch ($choice) {
    "1" {
        Write-Host ""
        Write-Host "Starting Ralph loop with 10 iterations..." -ForegroundColor Green
        & "$scriptDir\ralph-loop.ps1"
    }
    "2" {
        $iterations = Read-Host "Enter number of iterations"
        Write-Host ""
        Write-Host "Starting Ralph loop with $iterations iterations..." -ForegroundColor Green
        & "$scriptDir\ralph-loop.ps1" -MaxIterations $iterations
    }
    "3" {
        Write-Host ""
        Write-Host "Running single iteration..." -ForegroundColor Green
        Get-Content "RALPH-PROMPT.md" | claude
    }
    "4" {
        Write-Host "Exiting." -ForegroundColor Gray
        exit 0
    }
    default {
        Write-Host "Starting Ralph loop with default settings..." -ForegroundColor Green
        & "$scriptDir\ralph-loop.ps1"
    }
}
