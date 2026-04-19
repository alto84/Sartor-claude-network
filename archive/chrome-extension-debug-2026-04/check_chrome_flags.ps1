# Check Chrome's current command line to see if debug port is enabled
$chromeProcs = Get-CimInstance Win32_Process | Where-Object { $_.Name -eq "chrome.exe" -and $_.CommandLine -like "*--type=*" -eq $false }
foreach ($p in $chromeProcs) {
    if ($p.CommandLine -like "*remote-debugging*") {
        Write-Host "Chrome HAS debugging enabled!"
        Write-Host "  CMD: $($p.CommandLine.Substring(0, [Math]::Min(300, $p.CommandLine.Length)))"
    }
}

# Get Chrome's executable path
$mainChrome = Get-CimInstance Win32_Process | Where-Object { $_.Name -eq "chrome.exe" } | Select-Object -First 1
if ($mainChrome) {
    Write-Host "Chrome path: $($mainChrome.ExecutablePath)"
}

# Count Chrome processes
$count = (Get-Process chrome -ErrorAction SilentlyContinue).Count
Write-Host "Chrome process count: $count"

# Check default Chrome shortcut path for User Data dir
Write-Host ""
Write-Host "Chrome user data: C:\Users\alto8\AppData\Local\Google\Chrome\User Data"
Write-Host "Exists: $(Test-Path 'C:\Users\alto8\AppData\Local\Google\Chrome\User Data')"
