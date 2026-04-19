Add-Type -AssemblyName System.Windows.Forms
Add-Type @"
using System;
using System.Runtime.InteropServices;
public class WU4 {
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
    [WU4]::GetWindowText($proc.MainWindowHandle, $sb, 256) | Out-Null
    $title = $sb.ToString()
    if ($title -like "*Extensions*" -or $title -like "*Chrome*") {
        [WU4]::SetForegroundWindow($proc.MainWindowHandle) | Out-Null
        $rect = New-Object WU4+RECT
        [WU4]::GetWindowRect($proc.MainWindowHandle, [ref]$rect) | Out-Null

        # Developer mode toggle is at top-right of extensions page
        # Approximately at x=765, y=113 relative to window (based on screenshot)
        $devX = $rect.Left + 765
        $devY = $rect.Top + 113
        Write-Host "Clicking Developer mode toggle at ($devX, $devY)"
        [WU4]::SetCursorPos($devX, $devY)
        Start-Sleep -Milliseconds 200
        [WU4]::mouse_event($MOUSEEVENTF_LEFTDOWN, 0, 0, 0, 0)
        [WU4]::mouse_event($MOUSEEVENTF_LEFTUP, 0, 0, 0, 0)
        Start-Sleep -Seconds 2
        break
    }
}
