# Check log
$logFile = "C:\Users\alto8\AppData\Local\Claude\logs\chrome-native-host.log"
Write-Host "=== Log file ==="
if (Test-Path $logFile) {
    $info = Get-Item $logFile
    Write-Host "Size: $($info.Length) bytes, Modified: $($info.LastWriteTime)"
    if ($info.Length -gt 5) {
        Write-Host "Content (last 20 lines):"
        Get-Content $logFile -Tail 20
    } else {
        Write-Host "Empty/near-empty"
    }
} else {
    Write-Host "NOT FOUND"
}

# Verify the extension is actually active in Chrome
Write-Host ""
Write-Host "=== Chrome extension check ==="
$prefsFile = "C:\Users\alto8\AppData\Local\Google\Chrome\User Data\Default\Preferences"
if (Test-Path $prefsFile) {
    $raw = Get-Content $prefsFile -Raw
    $prefs = $raw | ConvertFrom-Json
    $extId = "fcoeoabgfenejglbffodgkkbkcdhcgfn"
    if ($prefs.extensions -and $prefs.extensions.settings -and $prefs.extensions.settings.$extId) {
        $ext = $prefs.extensions.settings.$extId
        Write-Host "Extension in Preferences: YES"
        Write-Host "  state: $($ext.state)"
        Write-Host "  location: $($ext.location)"
        if ($ext.manifest) {
            Write-Host "  manifest.version: $($ext.manifest.version)"
        }
    } else {
        Write-Host "Extension NOT in Preferences"
    }
} else {
    Write-Host "Preferences file not found"
}

# Check the native host parent process - who spawned it?
Write-Host ""
Write-Host "=== Native host process chain ==="
$nhs = Get-CimInstance Win32_Process | Where-Object { $_.CommandLine -like "*chrome-native-host*" }
foreach ($n in $nhs) {
    Write-Host "  PID=$($n.ProcessId) Name=$($n.Name) Parent=$($n.ParentProcessId)"
    # Get parent info
    $parent = Get-CimInstance Win32_Process | Where-Object { $_.ProcessId -eq $n.ParentProcessId }
    if ($parent) {
        Write-Host "    Parent: $($parent.Name) PID=$($parent.ProcessId)"
        $pCmdShort = $parent.CommandLine
        if ($pCmdShort -and $pCmdShort.Length -gt 150) { $pCmdShort = $pCmdShort.Substring(0, 150) + "..." }
        Write-Host "    ParentCmd: $pCmdShort"
    }
}
