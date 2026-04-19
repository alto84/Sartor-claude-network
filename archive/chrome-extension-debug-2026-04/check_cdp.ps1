# Check if Chrome is running and with what flags
Write-Host "=== Chrome processes ==="
$chromes = Get-CimInstance Win32_Process | Where-Object { $_.Name -eq "chrome.exe" }
Write-Host "Total chrome.exe: $($chromes.Count)"

# Find the main/browser process (no --type flag)
foreach ($p in $chromes) {
    if ($p.CommandLine -notlike "*--type=*") {
        Write-Host ""
        Write-Host "Main browser process PID=$($p.ProcessId):"
        Write-Host "  CMD: $($p.CommandLine)"
    }
}

# Check if port 9222 is listening
Write-Host ""
Write-Host "=== Port 9222 status ==="
$listening = Get-NetTCPConnection -LocalPort 9222 -ErrorAction SilentlyContinue
if ($listening) {
    foreach ($l in $listening) {
        Write-Host "  State=$($l.State) PID=$($l.OwningProcess)"
    }
} else {
    Write-Host "  Nothing listening on port 9222"
}

# Check if maybe Chrome used a different port or if there's a firewall issue
Write-Host ""
Write-Host "=== Chrome listening ports ==="
$chromePids = $chromes | ForEach-Object { $_.ProcessId }
$chromeListening = Get-NetTCPConnection -State Listen -ErrorAction SilentlyContinue | Where-Object { $_.OwningProcess -in $chromePids }
foreach ($cl in $chromeListening) {
    Write-Host "  Port $($cl.LocalPort) (PID $($cl.OwningProcess))"
}

# Try to connect via TCP directly
Write-Host ""
Write-Host "=== TCP connection test ==="
try {
    $tcp = New-Object System.Net.Sockets.TcpClient
    $tcp.Connect("127.0.0.1", 9222)
    Write-Host "TCP connected to 9222!"
    $tcp.Close()
} catch {
    Write-Host "TCP failed: $($_.Exception.Message)"
}
