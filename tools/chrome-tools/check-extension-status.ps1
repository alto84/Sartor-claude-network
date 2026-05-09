# Check extension status via CDP on default Chrome
# First check if default Chrome has a debug port
$chromePrefs = "C:\Users\alto8\AppData\Local\Google\Chrome\User Data\Default\Preferences"
if (Test-Path $chromePrefs) {
    Write-Output "Default profile exists"
}

# Check if extension has any stored state
$extStorage = "C:\Users\alto8\AppData\Local\Google\Chrome\User Data\Default\Local Extension Settings\fcoeoabgfenejglbffodgkkbkcdhcgfn"
if (Test-Path $extStorage) {
    Write-Output "Extension has local storage"
    Get-ChildItem $extStorage | ForEach-Object { Write-Output "  $($_.Name) ($($_.Length) bytes)" }
} else {
    Write-Output "No extension local storage found"
}

# Check which Chrome processes are running - look for profiles
$procs = Get-CimInstance Win32_Process -Filter "Name='chrome.exe'" -ErrorAction SilentlyContinue
$profiles = @{}
foreach ($p in $procs) {
    if ($p.CommandLine -match '--user-data-dir=([^\s"]+)') {
        $profiles[$Matches[1]] = $true
    }
    if ($p.CommandLine -match '--remote-debugging-port=(\d+)') {
        Write-Output "Debug port found: $($Matches[1]) in PID $($p.ProcessId)"
    }
}
Write-Output "Unique profile dirs: $($profiles.Keys -join ', ')"
if ($profiles.Count -eq 0) {
    Write-Output "(Chrome using default profile location)"
}

# Check if Claude Desktop is running (could conflict)
$desktop = Get-Process -Name "claude" -ErrorAction SilentlyContinue
if ($desktop) {
    Write-Output "WARNING: Claude Desktop is running ($($desktop.Count) processes)"
} else {
    Write-Output "Claude Desktop: not running"
}
