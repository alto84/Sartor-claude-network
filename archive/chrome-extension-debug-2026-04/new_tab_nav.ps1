Add-Type -AssemblyName System.Windows.Forms
Add-Type @"
using System;
using System.Runtime.InteropServices;
public class WNav2 {
    [DllImport("user32.dll")]
    public static extern bool SetForegroundWindow(IntPtr hWnd);
    [DllImport("user32.dll", CharSet = CharSet.Auto)]
    public static extern int GetWindowText(IntPtr hWnd, System.Text.StringBuilder lpString, int nMaxCount);
}
"@

$chromeProcs = Get-Process chrome -ErrorAction SilentlyContinue | Where-Object { $_.MainWindowHandle -ne [IntPtr]::Zero }
foreach ($proc in $chromeProcs) {
    $sb = New-Object System.Text.StringBuilder(256)
    [WNav2]::GetWindowText($proc.MainWindowHandle, $sb, 256) | Out-Null
    $title = $sb.ToString()
    Write-Host "Window: $title"
    if ($title -like "*Chrome*" -or $title -like "*reddit*" -or $title -like "*Diablo*" -or $title -like "*Claude*") {
        [WNav2]::SetForegroundWindow($proc.MainWindowHandle) | Out-Null
        Start-Sleep -Milliseconds 800

        # Click on the address bar area first to ensure Chrome has focus
        # Then use Ctrl+T for new tab
        [System.Windows.Forms.SendKeys]::SendWait("^t")
        Start-Sleep -Milliseconds 1000

        # New tab should have focus in the address bar
        [System.Windows.Forms.SendKeys]::SendWait("chrome://extensions{ENTER}")
        Write-Host "Navigating to extensions page"
        Start-Sleep -Seconds 3
        break
    }
}
