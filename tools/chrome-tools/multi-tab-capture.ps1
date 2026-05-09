Add-Type -AssemblyName System.Windows.Forms
Add-Type -AssemblyName System.Drawing
Add-Type @"
using System;
using System.Runtime.InteropServices;
public class Win32M {
    [DllImport("user32.dll")]
    public static extern bool SetForegroundWindow(IntPtr hWnd);
    [DllImport("user32.dll")]
    public static extern bool GetWindowRect(IntPtr hWnd, out RECT rect);
    [StructLayout(LayoutKind.Sequential)]
    public struct RECT { public int Left, Top, Right, Bottom; }
}
"@

$chrome = Get-Process chrome | Where-Object { $_.MainWindowTitle -like "*Cell Therapy*" } | Select-Object -First 1
if (-not $chrome) { Write-Error "No dashboard window"; exit 1 }
$hwnd = $chrome.MainWindowHandle
[Win32M]::SetForegroundWindow($hwnd) | Out-Null
Start-Sleep -Milliseconds 400

function Capture($name) {
    Start-Sleep -Milliseconds 800
    $rect = New-Object Win32M+RECT
    [Win32M]::GetWindowRect($hwnd, [ref]$rect) | Out-Null
    $w = $rect.Right - $rect.Left
    $h = $rect.Bottom - $rect.Top
    $bmp = New-Object System.Drawing.Bitmap($w, $h)
    $g = [System.Drawing.Graphics]::FromImage($bmp)
    $g.CopyFromScreen($rect.Left, $rect.Top, 0, 0, (New-Object System.Drawing.Size($w, $h)))
    $g.Dispose()
    $path = "C:\Users\alto8\chrome-tools\$name.png"
    $bmp.Save($path, [System.Drawing.Imaging.ImageFormat]::Png)
    $bmp.Dispose()
    Write-Output "Saved $name"
}

# Click Robert Kim (4th patient, approximate y=420 from top, x=90 in sidebar)
# Sidebar starts at x=0, patient cards around x=90
# Robert Kim is MODERATE risk - 4th item
$rect = New-Object Win32M+RECT
[Win32M]::GetWindowRect($hwnd, [ref]$rect) | Out-Null
$leftOffset = $rect.Left

# Click Robert Kim in sidebar (approx coordinates)
[System.Windows.Forms.Cursor]::Position = New-Object System.Drawing.Point(($leftOffset + 90), ($rect.Top + 430))
Start-Sleep -Milliseconds 100
# Simulate mouse click using SendInput
Add-Type @"
using System;
using System.Runtime.InteropServices;
public class MouseClick {
    [DllImport("user32.dll")]
    public static extern void mouse_event(uint dwFlags, uint dx, uint dy, uint dwData, int dwExtraInfo);
    public const uint MOUSEEVENTF_LEFTDOWN = 0x0002;
    public const uint MOUSEEVENTF_LEFTUP = 0x0004;
}
"@
[MouseClick]::mouse_event([MouseClick]::MOUSEEVENTF_LEFTDOWN, 0, 0, 0, 0)
Start-Sleep -Milliseconds 50
[MouseClick]::mouse_event([MouseClick]::MOUSEEVENTF_LEFTUP, 0, 0, 0, 0)
Start-Sleep -Milliseconds 1500

Capture "iter2-robert-kim-moderate"

# Now click CRS Monitor tab (approx x=leftOffset+490, y=rect.Top+118)
[System.Windows.Forms.Cursor]::Position = New-Object System.Drawing.Point(($leftOffset + 490), ($rect.Top + 118))
Start-Sleep -Milliseconds 100
[MouseClick]::mouse_event([MouseClick]::MOUSEEVENTF_LEFTDOWN, 0, 0, 0, 0)
Start-Sleep -Milliseconds 50
[MouseClick]::mouse_event([MouseClick]::MOUSEEVENTF_LEFTUP, 0, 0, 0, 0)
Start-Sleep -Milliseconds 1500

Capture "iter2-crs-monitor"

# Click ICANS tab 
[System.Windows.Forms.Cursor]::Position = New-Object System.Drawing.Point(($leftOffset + 575), ($rect.Top + 118))
Start-Sleep -Milliseconds 100
[MouseClick]::mouse_event([MouseClick]::MOUSEEVENTF_LEFTDOWN, 0, 0, 0, 0)
Start-Sleep -Milliseconds 50
[MouseClick]::mouse_event([MouseClick]::MOUSEEVENTF_LEFTUP, 0, 0, 0, 0)
Start-Sleep -Milliseconds 1500

Capture "iter2-icans-tab"

# Click Clinical Visit tab (rightmost)
[System.Windows.Forms.Cursor]::Position = New-Object System.Drawing.Point(($leftOffset + 1000), ($rect.Top + 118))
Start-Sleep -Milliseconds 100
[MouseClick]::mouse_event([MouseClick]::MOUSEEVENTF_LEFTDOWN, 0, 0, 0, 0)
Start-Sleep -Milliseconds 50
[MouseClick]::mouse_event([MouseClick]::MOUSEEVENTF_LEFTUP, 0, 0, 0, 0)
Start-Sleep -Milliseconds 1500

Capture "iter2-clinical-visit"

# Go back to Overview
[System.Windows.Forms.Cursor]::Position = New-Object System.Drawing.Point(($leftOffset + 240), ($rect.Top + 118))
Start-Sleep -Milliseconds 100
[MouseClick]::mouse_event([MouseClick]::MOUSEEVENTF_LEFTDOWN, 0, 0, 0, 0)
Start-Sleep -Milliseconds 50
[MouseClick]::mouse_event([MouseClick]::MOUSEEVENTF_LEFTUP, 0, 0, 0, 0)

Write-Output "All captures done"
