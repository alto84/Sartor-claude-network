Add-Type -AssemblyName System.Windows.Forms
Add-Type @"
using System;
using System.Runtime.InteropServices;
public class WinAPI5 {
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
    public struct RECT {
        public int Left, Top, Right, Bottom;
    }
}
"@

$MOUSEEVENTF_LEFTDOWN = 0x0002
$MOUSEEVENTF_LEFTUP = 0x0004

$chromeProcs = Get-Process chrome -ErrorAction SilentlyContinue | Where-Object { $_.MainWindowHandle -ne [IntPtr]::Zero }
foreach ($proc in $chromeProcs) {
    $sb = New-Object System.Text.StringBuilder(256)
    [WinAPI5]::GetWindowText($proc.MainWindowHandle, $sb, 256) | Out-Null
    $title = $sb.ToString()
    if ($title -like "*Claude*" -or $title -like "*Chrome*") {
        [WinAPI5]::SetForegroundWindow($proc.MainWindowHandle) | Out-Null
        $rect = New-Object WinAPI5+RECT
        [WinAPI5]::GetWindowRect($proc.MainWindowHandle, [ref]$rect) | Out-Null
        Write-Host "Chrome window: L=$($rect.Left) T=$($rect.Top) R=$($rect.Right) B=$($rect.Bottom)"

        # The Authorize button is centered horizontally, near the bottom of the visible area
        # Window width ~1936, content area is left ~750px wide, button is centered in that
        # Button appears to be around y=718 from top of window, x=390 from left of content
        $btnX = $rect.Left + 390
        $btnY = $rect.Top + 718
        Write-Host "Clicking Authorize at ($btnX, $btnY)"

        [WinAPI5]::SetCursorPos($btnX, $btnY)
        Start-Sleep -Milliseconds 300
        [WinAPI5]::mouse_event($MOUSEEVENTF_LEFTDOWN, 0, 0, 0, 0)
        [WinAPI5]::mouse_event($MOUSEEVENTF_LEFTUP, 0, 0, 0, 0)
        Write-Host "Clicked!"
        Start-Sleep -Seconds 5

        # Check if native host started
        $nh = Get-CimInstance Win32_Process | Where-Object { $_.CommandLine -like "*chrome-native-host*" -and $_.Name -eq "node.exe" }
        if ($nh) {
            foreach ($p in $nh) { Write-Host "Native host running! PID=$($p.ProcessId)" }
        } else {
            Write-Host "Native host not running yet"
        }
        break
    }
}
