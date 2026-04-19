Add-Type -AssemblyName System.Windows.Forms
Add-Type @"
using System;
using System.Runtime.InteropServices;
public class WinAPI4 {
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

# Focus Chrome
$chromeProcs = Get-Process chrome -ErrorAction SilentlyContinue | Where-Object { $_.MainWindowHandle -ne [IntPtr]::Zero }
$chrome = $null
foreach ($proc in $chromeProcs) {
    $sb = New-Object System.Text.StringBuilder(256)
    [WinAPI4]::GetWindowText($proc.MainWindowHandle, $sb, 256) | Out-Null
    $title = $sb.ToString()
    if ($title -like "*Extensions*" -or $title -like "*Chrome*") {
        $chrome = $proc
        break
    }
}

if ($chrome) {
    [WinAPI4]::SetForegroundWindow($chrome.MainWindowHandle) | Out-Null
    $rect = New-Object WinAPI4+RECT
    [WinAPI4]::GetWindowRect($chrome.MainWindowHandle, [ref]$rect) | Out-Null
    Write-Host "Chrome window: Left=$($rect.Left) Top=$($rect.Top) Right=$($rect.Right) Bottom=$($rect.Bottom)"

    # The Claude extension toggle is at approximately (610, 565) relative to the window
    # Based on the screenshot, the extensions page has Claude at the 3rd row
    # The toggle is on the right side of the extension card
    # Monitor 1 starts at x=2560, so add that offset
    $toggleX = $rect.Left + 610
    $toggleY = $rect.Top + 565
    Write-Host "Clicking toggle at ($toggleX, $toggleY)"

    [WinAPI4]::SetCursorPos($toggleX, $toggleY)
    Start-Sleep -Milliseconds 200
    [WinAPI4]::mouse_event($MOUSEEVENTF_LEFTDOWN, 0, 0, 0, 0)
    [WinAPI4]::mouse_event($MOUSEEVENTF_LEFTUP, 0, 0, 0, 0)
    Write-Host "Clicked - extension should toggle OFF"
    Start-Sleep -Seconds 2

    # Click again to toggle back ON
    [WinAPI4]::mouse_event($MOUSEEVENTF_LEFTDOWN, 0, 0, 0, 0)
    [WinAPI4]::mouse_event($MOUSEEVENTF_LEFTUP, 0, 0, 0, 0)
    Write-Host "Clicked again - extension should toggle ON"
    Start-Sleep -Seconds 3

    # Navigate to claude.ai
    [System.Windows.Forms.SendKeys]::SendWait("^l")
    Start-Sleep -Milliseconds 300
    [System.Windows.Forms.SendKeys]::SendWait("https://claude.ai{ENTER}")
    Write-Host "Navigating to claude.ai"
    Start-Sleep -Seconds 5

    # Check native host
    $nh = Get-CimInstance Win32_Process | Where-Object { $_.CommandLine -like "*chrome-native-host*" -and $_.Name -eq "node.exe" }
    if ($nh) {
        foreach ($p in $nh) { Write-Host "Native host running! PID=$($p.ProcessId)" }
    } else {
        Write-Host "Native host NOT running"
    }
} else {
    Write-Host "Chrome window not found"
}
