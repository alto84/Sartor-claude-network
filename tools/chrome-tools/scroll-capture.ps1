Add-Type -AssemblyName System.Windows.Forms
Add-Type -AssemblyName System.Drawing
Add-Type @"
using System;
using System.Runtime.InteropServices;
public class Win32S {
    [DllImport("user32.dll")]
    public static extern bool SetForegroundWindow(IntPtr hWnd);
    [DllImport("user32.dll")]
    public static extern bool GetWindowRect(IntPtr hWnd, out RECT rect);
    [StructLayout(LayoutKind.Sequential)]
    public struct RECT { public int Left, Top, Right, Bottom; }
}
"@

$chrome = Get-Process chrome | Where-Object { $_.MainWindowTitle -like "*Cell Therapy*" -or $_.MainWindowTitle -like "*Clinical Dashboard*" } | Select-Object -First 1
$hwnd = $chrome.MainWindowHandle
[Win32S]::SetForegroundWindow($hwnd) | Out-Null
Start-Sleep -Milliseconds 300

function Capture($name) {
    Start-Sleep -Milliseconds 600
    $rect = New-Object Win32S+RECT
    [Win32S]::GetWindowRect($hwnd, [ref]$rect) | Out-Null
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

# Scroll down on current Overview tab
[System.Windows.Forms.SendKeys]::SendWait("{END}")
Start-Sleep -Milliseconds 400
Capture "iter2-overview-bottom"

# Scroll back up
[System.Windows.Forms.SendKeys]::SendWait("{HOME}")
Start-Sleep -Milliseconds 300

# Click on "Robert Kim" (moderate risk) in sidebar - click at approximate position
# Robert Kim is the 4th patient, roughly y=420
# Actually let's use keyboard tab or click coordinates approach
# Let me just capture a couple key tabs by clicking

Write-Output "Done"
