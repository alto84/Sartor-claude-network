# Send F5 to Chrome to reload the page
Add-Type -AssemblyName System.Windows.Forms

# Find Chrome window
Add-Type @"
using System;
using System.Runtime.InteropServices;
public class WinAPI {
    [DllImport("user32.dll")]
    public static extern IntPtr FindWindow(string lpClassName, string lpWindowName);
    [DllImport("user32.dll")]
    public static extern bool SetForegroundWindow(IntPtr hWnd);
    [DllImport("user32.dll")]
    public static extern IntPtr GetForegroundWindow();
    [DllImport("user32.dll", CharSet = CharSet.Auto)]
    public static extern int GetWindowText(IntPtr hWnd, System.Text.StringBuilder lpString, int nMaxCount);
}
"@

# Find Chrome windows
$chromeProcs = Get-Process chrome -ErrorAction SilentlyContinue | Where-Object { $_.MainWindowHandle -ne [IntPtr]::Zero }
foreach ($proc in $chromeProcs) {
    $sb = New-Object System.Text.StringBuilder(256)
    [WinAPI]::GetWindowText($proc.MainWindowHandle, $sb, 256) | Out-Null
    $title = $sb.ToString()
    if ($title -like "*Claude*" -or $title -like "*claude.ai*") {
        Write-Host "Found Chrome window: '$title'"
        [WinAPI]::SetForegroundWindow($proc.MainWindowHandle) | Out-Null
        Start-Sleep -Milliseconds 500
        [System.Windows.Forms.SendKeys]::SendWait("{F5}")
        Write-Host "Sent F5 to reload"
        Start-Sleep -Seconds 3
        break
    }
}

# Check if native host started
$nh = Get-CimInstance Win32_Process | Where-Object { $_.CommandLine -like "*chrome-native-host*" }
if ($nh) {
    foreach ($p in $nh) { Write-Host "Native host started! PID=$($p.ProcessId)" }
} else {
    Write-Host "Native host still not running"
}
