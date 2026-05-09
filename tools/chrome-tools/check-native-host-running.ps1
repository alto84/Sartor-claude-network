# Check for ANY chrome-native-host processes
$procs = Get-CimInstance Win32_Process -Filter "Name='node.exe'" -ErrorAction SilentlyContinue
$found = $false
foreach ($p in $procs) {
    if ($p.CommandLine -match 'chrome-native-host') {
        Write-Output "FOUND native host: PID=$($p.ProcessId) CMD=$($p.CommandLine)"
        $found = $true
    }
    if ($p.CommandLine -match 'claude-in-chrome') {
        Write-Output "FOUND MCP bridge: PID=$($p.ProcessId) CMD=$($p.CommandLine)"
    }
}
if (-not $found) {
    Write-Output "NO chrome-native-host process found - Chrome is NOT launching the native host"
}

# Also check for the .exe variant (Claude Desktop version)
$exeProcs = Get-CimInstance Win32_Process -Filter "Name='chrome-native-host.exe'" -ErrorAction SilentlyContinue
if ($exeProcs) {
    foreach ($p in $exeProcs) {
        Write-Output "FOUND Desktop native host exe: PID=$($p.ProcessId)"
    }
} else {
    Write-Output "No chrome-native-host.exe process found either"
}

# Check Chrome's NativeMessagingHosts log
$nmhLog = "C:\Users\alto8\AppData\Local\Google\Chrome\User Data\Default\NativeMessagingHost"
if (Test-Path $nmhLog) {
    Write-Output "Native messaging log exists"
} else {
    Write-Output "No native messaging log directory"
}
