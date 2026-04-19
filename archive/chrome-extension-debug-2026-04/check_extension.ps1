Add-Type -AssemblyName System.Windows.Forms
Add-Type @"
using System;
using System.Runtime.InteropServices;
public class WinAPI3 {
    [DllImport("user32.dll")]
    public static extern bool SetForegroundWindow(IntPtr hWnd);
    [DllImport("user32.dll", CharSet = CharSet.Auto)]
    public static extern int GetWindowText(IntPtr hWnd, System.Text.StringBuilder lpString, int nMaxCount);
}
"@

$chromeProcs = Get-Process chrome -ErrorAction SilentlyContinue | Where-Object { $_.MainWindowHandle -ne [IntPtr]::Zero }
foreach ($proc in $chromeProcs) {
    $sb = New-Object System.Text.StringBuilder(256)
    [WinAPI3]::GetWindowText($proc.MainWindowHandle, $sb, 256) | Out-Null
    $title = $sb.ToString()
    if ($title -like "*Claude*" -or $title -like "*Chrome*") {
        Write-Host "Found: '$title'"
        [WinAPI3]::SetForegroundWindow($proc.MainWindowHandle) | Out-Null
        Start-Sleep -Milliseconds 500
        # Ctrl+L to focus address bar, type URL, Enter
        [System.Windows.Forms.SendKeys]::SendWait("^l")
        Start-Sleep -Milliseconds 300
        [System.Windows.Forms.SendKeys]::SendWait("chrome://extensions{ENTER}")
        Write-Host "Navigated to chrome://extensions"
        Start-Sleep -Seconds 3
        break
    }
}
