$nodeProcs = Get-CimInstance Win32_Process -Filter "Name='node.exe'" -ErrorAction SilentlyContinue
foreach ($p in $nodeProcs) {
    if ($p.CommandLine -match 'chrome|claude') {
        Write-Output "PID=$($p.ProcessId) CMD=$($p.CommandLine)"
    }
}
Write-Output "---CHROME---"
$chromeCount = (Get-Process chrome -ErrorAction SilentlyContinue).Count
Write-Output "Chrome processes: $chromeCount"
Write-Output "---EXTENSION---"
$extPath = "C:\Users\alto8\AppData\Local\Google\Chrome\User Data\Default\Extensions\fcoeoabgfenejglbffodgkkbkcdhcgfn"
if (Test-Path $extPath) {
    Get-ChildItem $extPath -Directory | ForEach-Object { Write-Output "Extension version: $($_.Name)" }
} else {
    Write-Output "Extension NOT found"
}
