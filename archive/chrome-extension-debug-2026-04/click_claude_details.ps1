Add-Type -AssemblyName System.Windows.Forms
Add-Type @"
using System;
using System.Runtime.InteropServices;
public class WU6 {
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
    [WU6]::GetWindowText($proc.MainWindowHandle, $sb, 256) | Out-Null
    $title = $sb.ToString()
    if ($title -like "*Extensions*" -or $title -like "*Chrome*") {
        [WU6]::SetForegroundWindow($proc.MainWindowHandle) | Out-Null
        $rect = New-Object WU6+RECT
        [WU6]::GetWindowRect($proc.MainWindowHandle, [ref]$rect) | Out-Null
        $w = $rect.Right - $rect.Left
        $h = $rect.Bottom - $rect.Top
        Write-Host "Window: $w x $h at ($($rect.Left),$($rect.Top))"

        # Use keyboard to navigate - press Tab to find the Details button
        # Or use Ctrl+F to search for Claude
        # Actually let me just try clicking more precisely
        # The Claude "Details" button in the top-right card
        # Based on the screenshot, it's at roughly 73% of window width, 28% of window height
        $btnX = $rect.Left + [int]($w * 0.73)
        $btnY = $rect.Top + [int]($h * 0.28)
        Write-Host "Clicking at ($btnX, $btnY)"
        [WU6]::SetCursorPos($btnX, $btnY)
        Start-Sleep -Milliseconds 300
        [WU6]::mouse_event($MOUSEEVENTF_LEFTDOWN, 0, 0, 0, 0)
        [WU6]::mouse_event($MOUSEEVENTF_LEFTUP, 0, 0, 0, 0)
        Start-Sleep -Seconds 3
        break
    }
}
