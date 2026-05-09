Add-Type -AssemblyName System.Windows.Forms
Add-Type -AssemblyName System.Drawing
Add-Type @"
using System;
using System.Runtime.InteropServices;
public class Win32JC {
    [DllImport("user32.dll")]
    public static extern bool SetForegroundWindow(IntPtr hWnd);
    [DllImport("user32.dll")]
    public static extern bool GetWindowRect(IntPtr hWnd, out RECT rect);
    [StructLayout(LayoutKind.Sequential)]
    public struct RECT { public int Left, Top, Right, Bottom; }
}
"@

Add-Type @"
using System;
using System.Runtime.InteropServices;
public class MouseJC {
    [DllImport("user32.dll")]
    public static extern void mouse_event(uint dwFlags, uint dx, uint dy, uint dwData, int dwExtraInfo);
    public const uint MOUSEEVENTF_LEFTDOWN = 0x0002;
    public const uint MOUSEEVENTF_LEFTUP = 0x0004;
}
"@

$chrome = Get-Process chrome | Where-Object { $_.MainWindowTitle -like "*Cell Therapy*" } | Select-Object -First 1
if (-not $chrome) { Write-Error "No dashboard"; exit 1 }
$hwnd = $chrome.MainWindowHandle
[Win32JC]::SetForegroundWindow($hwnd) | Out-Null
Start-Sleep -Milliseconds 500

$rect = New-Object Win32JC+RECT
[Win32JC]::GetWindowRect($hwnd, [ref]$rect) | Out-Null

# Click James Williams (2nd patient card, approx y=270 from window top)
[System.Windows.Forms.Cursor]::Position = New-Object System.Drawing.Point(($rect.Left + 90), ($rect.Top + 290))
Start-Sleep -Milliseconds 100
[MouseJC]::mouse_event([MouseJC]::MOUSEEVENTF_LEFTDOWN, 0, 0, 0, 0)
Start-Sleep -Milliseconds 50
[MouseJC]::mouse_event([MouseJC]::MOUSEEVENTF_LEFTUP, 0, 0, 0, 0)
Start-Sleep -Seconds 3

# Capture
$rect2 = New-Object Win32JC+RECT
[Win32JC]::GetWindowRect($hwnd, [ref]$rect2) | Out-Null
$w = $rect2.Right - $rect2.Left
$h = $rect2.Bottom - $rect2.Top
$bmp = New-Object System.Drawing.Bitmap($w, $h)
$g = [System.Drawing.Graphics]::FromImage($bmp)
$g.CopyFromScreen($rect2.Left, $rect2.Top, 0, 0, (New-Object System.Drawing.Size($w, $h)))
$g.Dispose()
$path = "C:\Users\alto8\chrome-tools\iter3-james-high.png"
$bmp.Save($path, [System.Drawing.Imaging.ImageFormat]::Png)
$bmp.Dispose()
Write-Output "Saved iter3-james-high.png"
