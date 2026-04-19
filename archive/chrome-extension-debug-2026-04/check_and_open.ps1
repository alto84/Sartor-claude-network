Add-Type -AssemblyName System.Windows.Forms
Add-Type @"
using System;
using System.Runtime.InteropServices;
public class WU2 {
    [DllImport("user32.dll")]
    public static extern bool SetForegroundWindow(IntPtr hWnd);
    [DllImport("user32.dll", CharSet = CharSet.Auto)]
    public static extern int GetWindowText(IntPtr hWnd, System.Text.StringBuilder lpString, int nMaxCount);
}
"@

# Check native host
$nh = Get-CimInstance Win32_Process | Where-Object { $_.CommandLine -like "*chrome-native-host*" -and $_.Name -eq "node.exe" }
if ($nh) { Write-Host "Native host RUNNING" } else { Write-Host "Native host NOT running" }
Write-Host "Pipe: $(Test-Path '\\.\pipe\claude-mcp-browser-bridge-alton')"

# Open sidepanel with Ctrl+E
$chromeProcs = Get-Process chrome -ErrorAction SilentlyContinue | Where-Object { $_.MainWindowHandle -ne [IntPtr]::Zero }
foreach ($proc in $chromeProcs) {
    $sb = New-Object System.Text.StringBuilder(256)
    [WU2]::GetWindowText($proc.MainWindowHandle, $sb, 256) | Out-Null
    $title = $sb.ToString()
    if ($title -like "*Claude*" -or $title -like "*Chrome*") {
        [WU2]::SetForegroundWindow($proc.MainWindowHandle) | Out-Null
        Start-Sleep -Milliseconds 500
        [System.Windows.Forms.SendKeys]::SendWait("^e")
        Write-Host "Sent Ctrl+E to toggle sidepanel"
        Start-Sleep -Seconds 3
        break
    }
}

# Re-check native host
$nh2 = Get-CimInstance Win32_Process | Where-Object { $_.CommandLine -like "*chrome-native-host*" -and $_.Name -eq "node.exe" }
if ($nh2) { Write-Host "Native host NOW RUNNING" } else { Write-Host "Native host still not running" }
Write-Host "Pipe now: $(Test-Path '\\.\pipe\claude-mcp-browser-bridge-alton')"

# Check log
Write-Host ""
Write-Host "=== Latest log ==="
Get-Content "C:\Users\alto8\AppData\Local\Claude\logs\chrome-native-host.log" -Tail 5
