Add-Type -AssemblyName System.Windows.Forms
Add-Type @"
using System;
using System.Runtime.InteropServices;
public class WClick {
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
    [WClick]::GetWindowText($proc.MainWindowHandle, $sb, 256) | Out-Null
    $title = $sb.ToString()
    if ($title -like "*Chrome*" -or $title -like "*Claude*" -or $title -like "*chrome web store*") {
        [WClick]::SetForegroundWindow($proc.MainWindowHandle) | Out-Null
        Start-Sleep -Milliseconds 500

        $rect = New-Object WClick+RECT
        [WClick]::GetWindowRect($proc.MainWindowHandle, [ref]$rect) | Out-Null
        $w = $rect.Right - $rect.Left
        $h = $rect.Bottom - $rect.Top
        Write-Host "Window: Left=$($rect.Left) Top=$($rect.Top) W=$w H=$h"

        # The "Add extension" button is in the dialog, approximately at:
        # From the screenshot: dialog center is about 50% width, button is at lower-left of dialog
        # "Add extension" button appears to be at about 52% from left, 28% from top
        $btnX = $rect.Left + [int]($w * 0.52)
        $btnY = $rect.Top + [int]($h * 0.37)

        Write-Host "Clicking Add extension at ($btnX, $btnY)"
        [WClick]::SetCursorPos($btnX, $btnY)
        Start-Sleep -Milliseconds 200
        [WClick]::mouse_event($MOUSEEVENTF_LEFTDOWN, 0, 0, 0, 0)
        [WClick]::mouse_event($MOUSEEVENTF_LEFTUP, 0, 0, 0, 0)
        Write-Host "Clicked!"
        Start-Sleep -Seconds 3
        break
    }
}
