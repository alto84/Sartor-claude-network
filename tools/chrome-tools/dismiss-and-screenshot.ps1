Add-Type -AssemblyName System.Windows.Forms

# Find and focus the Chrome sign-in dialog
Start-Sleep -Milliseconds 300

# Send Escape to dismiss the dialog
[System.Windows.Forms.SendKeys]::SendWait("{ESC}")
Start-Sleep -Milliseconds 1000

# Now capture the dashboard
Add-Type -AssemblyName System.Drawing
Add-Type @"
using System;
using System.Runtime.InteropServices;
public class Win32Cap {
    [DllImport("user32.dll")]
    public static extern bool SetForegroundWindow(IntPtr hWnd);
    [DllImport("user32.dll")]
    public static extern bool GetWindowRect(IntPtr hWnd, out RECT rect);
    [DllImport("user32.dll")]
    public static extern bool ShowWindow(IntPtr hWnd, int nCmdShow);
    [StructLayout(LayoutKind.Sequential)]
    public struct RECT { public int Left, Top, Right, Bottom; }
}
"@

$chrome = Get-Process chrome | Where-Object { $_.MainWindowTitle -like "*Clinical Dashboard*" -or $_.MainWindowTitle -like "*Cell Therapy*" } | Select-Object -First 1
if (-not $chrome) {
    $chrome = Get-Process chrome | Where-Object { $_.MainWindowTitle -like "*192.168*" } | Select-Object -First 1
}
if (-not $chrome) {
    Write-Error "No dashboard window found"
    exit 1
}

$hwnd = $chrome.MainWindowHandle
# Maximize window
[Win32Cap]::ShowWindow($hwnd, 3) | Out-Null
Start-Sleep -Milliseconds 500
[Win32Cap]::SetForegroundWindow($hwnd) | Out-Null
Start-Sleep -Milliseconds 500

$rect = New-Object Win32Cap+RECT
[Win32Cap]::GetWindowRect($hwnd, [ref]$rect) | Out-Null

$w = $rect.Right - $rect.Left
$h = $rect.Bottom - $rect.Top
$bmp = New-Object System.Drawing.Bitmap($w, $h)
$g = [System.Drawing.Graphics]::FromImage($bmp)
$g.CopyFromScreen($rect.Left, $rect.Top, 0, 0, (New-Object System.Drawing.Size($w, $h)))
$g.Dispose()

$outPath = "C:\Users\alto8\chrome-tools\dashboard-iter2-clean.png"
$bmp.Save($outPath, [System.Drawing.Imaging.ImageFormat]::Png)
$bmp.Dispose()
Write-Output "Saved to $outPath ($w x $h)"
