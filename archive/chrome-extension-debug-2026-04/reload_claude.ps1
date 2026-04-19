Add-Type -AssemblyName System.Windows.Forms
Add-Type @"
using System;
using System.Runtime.InteropServices;
public class WinUtil {
    [DllImport("user32.dll")]
    public static extern bool SetForegroundWindow(IntPtr hWnd);
    [DllImport("user32.dll", CharSet = CharSet.Auto)]
    public static extern int GetWindowText(IntPtr hWnd, System.Text.StringBuilder lpString, int nMaxCount);
}
"@

$chromeProcs = Get-Process chrome -ErrorAction SilentlyContinue | Where-Object { $_.MainWindowHandle -ne [IntPtr]::Zero }
foreach ($proc in $chromeProcs) {
    $sb = New-Object System.Text.StringBuilder(256)
    [WinUtil]::GetWindowText($proc.MainWindowHandle, $sb, 256) | Out-Null
    $title = $sb.ToString()
    if ($title -like "*Chrome*" -or $title -like "*Claude*") {
        Write-Host "Found: '$title'"
        [WinUtil]::SetForegroundWindow($proc.MainWindowHandle) | Out-Null
        Start-Sleep -Milliseconds 500
        [System.Windows.Forms.SendKeys]::SendWait("^l")
        Start-Sleep -Milliseconds 300
        [System.Windows.Forms.SendKeys]::SendWait("https://claude.ai{ENTER}")
        Write-Host "Navigating to claude.ai"
        Start-Sleep -Seconds 5
        break
    }
}
