# install.ps1 - Safety Research Wiki bundle installer (Windows PowerShell)
# Run from the bundle root: .\scripts\install.ps1

$ErrorActionPreference = "Stop"

Write-Host "=== Safety Research Wiki - Windows Installer ===" -ForegroundColor Cyan
Write-Host ""

# Resolve the bundle root (one level up from this script)
$BundleRoot = Split-Path -Parent $PSScriptRoot
if (-not (Test-Path "$BundleRoot\wiki.py")) {
    # If scripts/ is not one level deep, try the current directory
    $BundleRoot = Get-Location
    if (-not (Test-Path "$BundleRoot\wiki.py")) {
        Write-Host "ERROR: wiki.py not found. Run this script from the bundle root." -ForegroundColor Red
        Write-Host "Expected layout: <bundle-root>/wiki.py and <bundle-root>/scripts/install.ps1"
        exit 1
    }
}
Set-Location $BundleRoot
Write-Host "Bundle root: $BundleRoot"

# Check Python
try {
    $pyVersion = python --version 2>&1
    Write-Host "Found Python: $pyVersion"
} catch {
    Write-Host "ERROR: python not found in PATH. Install Python 3.10+ first." -ForegroundColor Red
    exit 1
}

# Verify Python >= 3.10
$versionCheck = python -c "import sys; sys.exit(0 if sys.version_info >= (3, 10) else 1)" 2>&1
if ($LASTEXITCODE -ne 0) {
    Write-Host "ERROR: Python 3.10+ required." -ForegroundColor Red
    exit 1
}

# Create state directory
$StateDir = Join-Path $BundleRoot "state"
if (-not (Test-Path $StateDir)) {
    New-Item -ItemType Directory -Path $StateDir | Out-Null
    Write-Host "Created state/ directory"
} else {
    Write-Host "state/ directory already exists"
}

# Create indexes directory
$IndexesDir = Join-Path $BundleRoot "indexes"
if (-not (Test-Path $IndexesDir)) {
    New-Item -ItemType Directory -Path $IndexesDir | Out-Null
    Write-Host "Created indexes/ directory"
}

# Run selftest
Write-Host ""
Write-Host "=== Running wiki.py --selftest ===" -ForegroundColor Cyan
python wiki.py --selftest
if ($LASTEXITCODE -ne 0) {
    Write-Host "WARNING: selftest had failures. Review above output." -ForegroundColor Yellow
} else {
    Write-Host ""
    Write-Host "Install complete. Next steps:" -ForegroundColor Green
    Write-Host "  1. Read skills\safety-research-wiki\SKILL.md"
    Write-Host "  2. Copy a template from templates\ to create your first real page"
    Write-Host "  3. Run: python wiki.py --reindex"
    Write-Host "  4. Run: python wiki.py --article <your-page-stem>"
}
