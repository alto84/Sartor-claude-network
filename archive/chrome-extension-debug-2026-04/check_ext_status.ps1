# Check if extension files exist
Write-Host "=== Extension files on disk ==="
$extDir = "C:\Users\alto8\AppData\Local\Google\Chrome\User Data\Default\Extensions\fcoeoabgfenejglbffodgkkbkcdhcgfn"
if (Test-Path $extDir) {
    Write-Host "Extension directory EXISTS"
    Get-ChildItem $extDir | ForEach-Object { Write-Host "  $($_.Name)" }
} else {
    Write-Host "Extension directory MISSING"
}

# Check Chrome's Preferences file for extension state
Write-Host ""
Write-Host "=== Chrome Preferences - Extension State ==="
$prefsFile = "C:\Users\alto8\AppData\Local\Google\Chrome\User Data\Default\Preferences"
if (Test-Path $prefsFile) {
    $prefs = Get-Content $prefsFile -Raw | ConvertFrom-Json
    $extId = "fcoeoabgfenejglbffodgkkbkcdhcgfn"

    # Check extensions.settings
    if ($prefs.extensions -and $prefs.extensions.settings -and $prefs.extensions.settings.$extId) {
        $ext = $prefs.extensions.settings.$extId
        Write-Host "Extension found in settings!"
        Write-Host "  state: $($ext.state)"
        Write-Host "  enabled: $($ext.enabled)"
        Write-Host "  location: $($ext.location)"
        Write-Host "  manifest version: $($ext.manifest.version)"
        Write-Host "  was_installed_by_default: $($ext.was_installed_by_default)"
        Write-Host "  disable_reasons: $($ext.disable_reasons)"
        Write-Host "  path: $($ext.path)"
    } else {
        Write-Host "Extension NOT found in Chrome settings!"
    }
} else {
    Write-Host "Preferences file not found"
}

# Check Secure Preferences too
Write-Host ""
Write-Host "=== Secure Preferences ==="
$secPrefsFile = "C:\Users\alto8\AppData\Local\Google\Chrome\User Data\Default\Secure Preferences"
if (Test-Path $secPrefsFile) {
    $secPrefs = Get-Content $secPrefsFile -Raw | ConvertFrom-Json
    $extId = "fcoeoabgfenejglbffodgkkbkcdhcgfn"
    if ($secPrefs.extensions -and $secPrefs.extensions.settings -and $secPrefs.extensions.settings.$extId) {
        $ext = $secPrefs.extensions.settings.$extId
        Write-Host "Extension found in secure settings!"
        Write-Host "  state: $($ext.state)"
        Write-Host "  disable_reasons: $($ext.disable_reasons)"
    } else {
        Write-Host "Extension NOT in secure settings"
    }
}
