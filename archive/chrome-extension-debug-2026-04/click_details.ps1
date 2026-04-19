Add-Type -AssemblyName System.Windows.Forms
Add-Type @"
using System;
using System.Runtime.InteropServices;
public class WU5 {
    [DllImport("user32.dll")]
    public static extern bool SetForegroundWindow(IntPtr hWnd);
    [DllImport("user32.dll", CharSet = CharSet.Auto)]
    public static extern int GetWindowText(IntPtr hWnd, System.Text.StringBuilder lpString, int nMaxCount);
    [DllImport("user32.dll")]
    public static extern void SetCursorPos(int x, int y);
    [DllImport("user32.dll")]
    public static extern void mouse_event(uint dwFlags, uint dx, uint dy, uint dwData, int dwExtraInfo);
    [DllImport("user32.dll")]
    public static extern bool GetWindowRect(IntPtr hWnd, out RECT rect);
    [StructLayout(LayoutKind.Sequential)]
    public struct RECT { public int Left, Top, Right, Bottom; }
}
"@

$MOUSEEVENTF_LEFTDOWN = 0x0002
$MOUSEEVENTF_LEFTUP = 0x0004

$chromeProcs = Get-Process chrome -ErrorAction SilentlyContinue | Where-Object { $_.MainWindowHandle -ne [IntPtr]::Zero }
foreach ($proc in $chromeProcs) {
    $sb = New-Object System.Text.StringBuilder(256)
    [WU5]::GetWindowText($proc.MainWindowHandle, $sb, 256) | Out-Null
    $title = $sb.ToString()
    if ($title -like "*Extensions*" -or $title -like "*Chrome*") {
        [WU5]::SetForegroundWindow($proc.MainWindowHandle) | Out-Null
        $rect = New-Object WU5+RECT
        [WU5]::GetWindowRect($proc.MainWindowHandle, [ref]$rect) | Out-Null

        # First dismiss the dropdown by pressing Escape
        [System.Windows.Forms.SendKeys]::SendWait("{ESC}")
        Start-Sleep -Milliseconds 500

        # Claude extension "Details" button - top right card
        # Based on screenshot, Claude card is at top-right
        # Details button is at approximately x=970, y=305 relative to window
        $btnX = $rect.Left + 970
        $btnY = $rect.Top + 305
        Write-Host "Clicking Claude Details at ($btnX, $btnY)"
        [WU5]::SetCursorPos($btnX, $btnY)
        Start-Sleep -Milliseconds 200
        [WU5]::mouse_event($MOUSEEVENTF_LEFTDOWN, 0, 0, 0, 0)
        [WU5]::mouse_event($MOUSEEVENTF_LEFTUP, 0, 0, 0, 0)
        Start-Sleep -Seconds 2
        break
    }
}
