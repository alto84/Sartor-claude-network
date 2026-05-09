# Kill only the default profile Chrome, not the automation one
$procs = Get-CimInstance Win32_Process -Filter "Name='chrome.exe'" -ErrorAction SilentlyContinue
foreach ($p in $procs) {
    if ($p.CommandLine -notmatch 'chrome-automation-profile') {
        Stop-Process -Id $p.ProcessId -Force -ErrorAction SilentlyContinue
    }
}
Start-Sleep -Seconds 3

# Relaunch default Chrome
Start-Process 'C:\Program Files (x86)\Google\Chrome\Application\chrome.exe' -ArgumentList 'http://192.168.1.100:8000/static/index.html?v=11'
Start-Sleep -Seconds 8
Write-Output "Chrome relaunched"
