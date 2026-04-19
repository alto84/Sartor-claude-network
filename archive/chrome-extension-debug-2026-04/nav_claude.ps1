Add-Type -AssemblyName System.Windows.Forms
Add-Type @"
using System;
using System.Runtime.InteropServices;
public class WNav {
    [DllImport("user32.dll")]
    public static extern bool SetForegroundWindow(IntPtr hWnd);
    [DllImport("user32.dll", CharSet = CharSet.Auto)]
    public static extern int GetWindowText(IntPtr hWnd, System.Text.StringBuilder lpString, int nMaxCount);
}
"@

$chromeProcs = Get-Process chrome -ErrorAction SilentlyContinue | Where-Object { $_.MainWindowHandle -ne [IntPtr]::Zero }
foreach ($proc in $chromeProcs) {
    $sb = New-Object System.Text.StringBuilder(256)
    [WNav]::GetWindowText($proc.MainWindowHandle, $sb, 256) | Out-Null
    $title = $sb.ToString()
    Write-Host "Found Chrome window: $title"
    if ($title -like "*Chrome*" -or $title -like "*reddit*" -or $title -like "*Claude*") {
        [WNav]::SetForegroundWindow($proc.MainWindowHandle) | Out-Null
        Start-Sleep -Milliseconds 500
        # Open new tab and go to claude.ai
        [System.Windows.Forms.SendKeys]::SendWait("^t")
        Start-Sleep -Milliseconds 500
        [System.Windows.Forms.SendKeys]::SendWait("https://claude.ai{ENTER}")
        Write-Host "Navigated to claude.ai"
        Start-Sleep -Seconds 5
        break
    }
}
