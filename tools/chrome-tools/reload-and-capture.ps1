Add-Type -AssemblyName System.Windows.Forms
Add-Type -AssemblyName System.Drawing
Add-Type @"
using System;
using System.Runtime.InteropServices;
public class Win32R {
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
[Win32R]::SetForegroundWindow($hwnd) | Out-Null
Start-Sleep -Milliseconds 500

# Press F5 to reload
[System.Windows.Forms.SendKeys]::SendWait("{F5}")
Start-Sleep -Seconds 4

# Capture
$rect = New-Object Win32R+RECT
[Win32R]::GetWindowRect($hwnd, [ref]$rect) | Out-Null
$w = $rect.Right - $rect.Left
$h = $rect.Bottom - $rect.Top
$bmp = New-Object System.Drawing.Bitmap($w, $h)
$g = [System.Drawing.Graphics]::FromImage($bmp)
$g.CopyFromScreen($rect.Left, $rect.Top, 0, 0, (New-Object System.Drawing.Size($w, $h)))
$g.Dispose()
$path = "C:\Users\alto8\chrome-tools\dashboard-iter3.png"
$bmp.Save($path, [System.Drawing.Imaging.ImageFormat]::Png)
$bmp.Dispose()
Write-Output "Saved dashboard-iter3.png ($w x $h)"
