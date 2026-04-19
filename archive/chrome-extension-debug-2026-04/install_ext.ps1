Add-Type -AssemblyName System.Windows.Forms
Add-Type @"
using System;
using System.Runtime.InteropServices;
public class WInst {
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
$chrome = $null
foreach ($proc in $chromeProcs) {
    $sb = New-Object System.Text.StringBuilder(256)
    [WInst]::GetWindowText($proc.MainWindowHandle, $sb, 256) | Out-Null
    $title = $sb.ToString()
    if ($title -like "*Chrome*" -or $title -like "*reddit*" -or $title -like "*Claude*" -or $title -like "*Diablo*") {
        $chrome = $proc
        break
    }
}

if (-not $chrome) { Write-Host "Chrome not found!"; exit }

[WInst]::SetForegroundWindow($chrome.MainWindowHandle) | Out-Null
Start-Sleep -Milliseconds 500

# Navigate to the Chrome Web Store page for Claude extension
[System.Windows.Forms.SendKeys]::SendWait("^l")
Start-Sleep -Milliseconds 300
[System.Windows.Forms.SendKeys]::SendWait("https://chromewebstore.google.com/detail/claude/fcoeoabgfenejglbffodgkkbkcdhcgfn{ENTER}")
Write-Host "Navigating to Chrome Web Store Claude page..."
Start-Sleep -Seconds 5

# Take a screenshot so we can see what happened
Add-Type -AssemblyName System.Drawing
$screen = [System.Windows.Forms.Screen]::AllScreens[1]
$b = $screen.Bounds
$bitmap = New-Object System.Drawing.Bitmap($b.Width, $b.Height)
$graphics = [System.Drawing.Graphics]::FromImage($bitmap)
$graphics.CopyFromScreen($b.Location, [System.Drawing.Point]::Empty, $b.Size)
$bitmap.Save("C:\Users\alto8\webstore_page.png")
$graphics.Dispose()
$bitmap.Dispose()
Write-Host "Screenshot saved"
