param(
    [Parameter(Mandatory=$true)][int]$X,
    [Parameter(Mandatory=$true)][int]$Y,
    [switch]$Right,
    [switch]$Double
)

Add-Type @"
using System;
using System.Runtime.InteropServices;

public class MouseInput {
    [DllImport("user32.dll")]
    public static extern bool SetCursorPos(int x, int y);

    [DllImport("user32.dll")]
    public static extern void mouse_event(uint dwFlags, int dx, int dy, uint dwData, IntPtr dwExtraInfo);

    public const uint MOUSEEVENTF_LEFTDOWN = 0x0002;
    public const uint MOUSEEVENTF_LEFTUP = 0x0004;
    public const uint MOUSEEVENTF_RIGHTDOWN = 0x0008;
    public const uint MOUSEEVENTF_RIGHTUP = 0x0010;

    public static void LeftClick() {
        mouse_event(MOUSEEVENTF_LEFTDOWN, 0, 0, 0, IntPtr.Zero);
        mouse_event(MOUSEEVENTF_LEFTUP, 0, 0, 0, IntPtr.Zero);
    }

    public static void RightClick() {
        mouse_event(MOUSEEVENTF_RIGHTDOWN, 0, 0, 0, IntPtr.Zero);
        mouse_event(MOUSEEVENTF_RIGHTUP, 0, 0, 0, IntPtr.Zero);
    }

    public static void DoubleClick() {
        mouse_event(MOUSEEVENTF_LEFTDOWN, 0, 0, 0, IntPtr.Zero);
        mouse_event(MOUSEEVENTF_LEFTUP, 0, 0, 0, IntPtr.Zero);
        System.Threading.Thread.Sleep(50);
        mouse_event(MOUSEEVENTF_LEFTDOWN, 0, 0, 0, IntPtr.Zero);
        mouse_event(MOUSEEVENTF_LEFTUP, 0, 0, 0, IntPtr.Zero);
    }
}
"@

try {
    $result = [MouseInput]::SetCursorPos($X, $Y)
    if (-not $result) {
        Write-Error "Failed to set cursor position to ($X, $Y)"
        exit 1
    }

    Start-Sleep -Milliseconds 50

    if ($Right) {
        [MouseInput]::RightClick()
        Write-Output "Right-clicked at ($X, $Y)"
    }
    elseif ($Double) {
        [MouseInput]::DoubleClick()
        Write-Output "Double-clicked at ($X, $Y)"
    }
    else {
        [MouseInput]::LeftClick()
        Write-Output "Left-clicked at ($X, $Y)"
    }
}
catch {
    Write-Error "Click failed: $_"
    exit 1
}
