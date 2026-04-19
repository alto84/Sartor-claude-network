# Is the native host actually alive?
Write-Host "=== Native host processes ==="
$all = Get-CimInstance Win32_Process | Where-Object { $_.CommandLine -like "*chrome-native-host*" }
foreach ($p in $all) {
    Write-Host "  PID=$($p.ProcessId) Name=$($p.Name) Started=$($p.CreationDate)"
    # Check if it's a zombie
    try {
        $proc = Get-Process -Id $p.ProcessId -ErrorAction Stop
        Write-Host "    Status: Responding=$($proc.Responding) Threads=$($proc.Threads.Count) WorkingSet=$([math]::Round($proc.WorkingSet64/1MB,1))MB"
    } catch {
        Write-Host "    Status: DEAD (can't get process)"
    }
}

# Check ALL log files in the Claude logs directory
Write-Host ""
Write-Host "=== All log files ==="
$logDir = "C:\Users\alto8\AppData\Local\Claude\logs"
if (Test-Path $logDir) {
    Get-ChildItem $logDir | ForEach-Object {
        Write-Host "  $($_.Name) - Size=$($_.Length) Modified=$($_.LastWriteTime)"
    }
} else {
    Write-Host "  Log directory doesn't exist!"
}

# Check if there's a newer log location
Write-Host ""
Write-Host "=== Other possible log locations ==="
$altLogs = @(
    "C:\Users\alto8\AppData\Local\Claude\chrome-native-host.log",
    "C:\Users\alto8\.claude\logs",
    "C:\Users\alto8\AppData\Roaming\Claude\logs"
)
foreach ($loc in $altLogs) {
    if (Test-Path $loc) {
        Write-Host "  EXISTS: $loc"
        if ((Get-Item $loc).PSIsContainer) {
            Get-ChildItem $loc | ForEach-Object { Write-Host "    $($_.Name) - Size=$($_.Length)" }
        } else {
            Write-Host "    Size=$((Get-Item $loc).Length)"
        }
    }
}

# Check the MCP process too
Write-Host ""
Write-Host "=== MCP process ==="
$mcp = Get-CimInstance Win32_Process | Where-Object { $_.CommandLine -like "*claude-in-chrome-mcp*" }
foreach ($p in $mcp) {
    Write-Host "  PID=$($p.ProcessId) Started=$($p.CreationDate)"
    try {
        $proc = Get-Process -Id $p.ProcessId -ErrorAction Stop
        Write-Host "    Status: Responding=$($proc.Responding) Threads=$($proc.Threads.Count) WorkingSet=$([math]::Round($proc.WorkingSet64/1MB,1))MB"
    } catch {
        Write-Host "    Status: DEAD"
    }
}

# Try to check what the current native host version is
Write-Host ""
Write-Host "=== Chrome native host bat content ==="
$bat = "C:\Users\alto8\.claude\chrome\chrome-native-host.bat"
if (Test-Path $bat) {
    Get-Content $bat
}

# Check if claude code has a chrome-specific config
Write-Host ""
Write-Host "=== Chrome extension config ==="
$chromeCfg = "C:\Users\alto8\.claude\chrome"
if (Test-Path $chromeCfg) {
    Get-ChildItem $chromeCfg | ForEach-Object {
        Write-Host "  $($_.Name) - Size=$($_.Length)"
    }
}
