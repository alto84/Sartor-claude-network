Add-Type -AssemblyName System.Windows.Forms
Add-Type @"
using System;
using System.Runtime.InteropServices;
public class WU9 {
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
    [WU9]::GetWindowText($proc.MainWindowHandle, $sb, 256) | Out-Null
    $title = $sb.ToString()
    if ($title -like "*Chrome*" -or $title -like "*Extensions*" -or $title -like "*Claude*") {
        $chrome = $proc
        break
    }
}

if (-not $chrome) { Write-Host "Chrome not found!"; exit }

[WU9]::SetForegroundWindow($chrome.MainWindowHandle) | Out-Null
Start-Sleep -Milliseconds 500

# Step 1: Navigate to extensions page
[System.Windows.Forms.SendKeys]::SendWait("^l")
Start-Sleep -Milliseconds 300
[System.Windows.Forms.SendKeys]::SendWait("chrome://extensions{ENTER}")
Write-Host "Step 1: Navigating to extensions page"
Start-Sleep -Seconds 2

# Step 2: Use JavaScript to toggle Claude extension via chrome://extensions internals
# Actually, we can use the extensions page API. But simpler: use keyboard shortcut.
# Let's use the address bar to disable then enable the extension
[System.Windows.Forms.SendKeys]::SendWait("^l")
Start-Sleep -Milliseconds 300
# Chrome has no direct URL to toggle, but we can use chrome.management API from devtools
# Simpler: navigate to the extension toggle via keyboard
# Actually let's just navigate directly and use JS from devtools console

# Let me try using JS via the address bar (javascript: doesn't work in chrome)
# Let's just click the toggle. Based on the grid view, Claude is top-right card.
# We need to find its toggle position.

$rect = New-Object WU9+RECT
[WU9]::GetWindowRect($chrome.MainWindowHandle, [ref]$rect) | Out-Null
$w = $rect.Right - $rect.Left

# From the previous screenshot, Claude extension toggle was at approximately:
# Card is at right side of grid, toggle is at far right of card
# In the grid layout, the toggle is at about x=1210, y=305 relative to content area start
# Content area starts after sidebar (~200px) + window left edge

# Toggle position (based on screenshot analysis):
# Claude card right edge is about 1270px from content area left
# Toggle is at about x=1207 from content start
# Content starts at about x=235 from window left
$toggleX = $rect.Left + 1207 + 235
$toggleY = $rect.Top + 305
Write-Host "Step 2: Clicking Claude toggle OFF at ($toggleX, $toggleY)"
# Actually wait, the exact position depends on the current layout. Let me be smarter.
# From the last screenshot of extensions grid, Claude card toggle was at approx:
# 73% window width, 29% window height for the center of the toggle
$toggleX = $rect.Left + [int]($w * 0.96)
$toggleY = $rect.Top + [int](($rect.Bottom - $rect.Top) * 0.25)
Write-Host "  Adjusted: ($toggleX, $toggleY)"

[WU9]::SetCursorPos($toggleX, $toggleY)
Start-Sleep -Milliseconds 200
[WU9]::mouse_event($MOUSEEVENTF_LEFTDOWN, 0, 0, 0, 0)
[WU9]::mouse_event($MOUSEEVENTF_LEFTUP, 0, 0, 0, 0)
Write-Host "  Clicked - should toggle OFF"
Start-Sleep -Seconds 2

# Step 3: Click again to toggle ON
[WU9]::mouse_event($MOUSEEVENTF_LEFTDOWN, 0, 0, 0, 0)
[WU9]::mouse_event($MOUSEEVENTF_LEFTUP, 0, 0, 0, 0)
Write-Host "Step 3: Clicked again - should toggle ON"
Start-Sleep -Seconds 3

# Step 4: Navigate to claude.ai
[System.Windows.Forms.SendKeys]::SendWait("^l")
Start-Sleep -Milliseconds 300
[System.Windows.Forms.SendKeys]::SendWait("https://claude.ai{ENTER}")
Write-Host "Step 4: Navigating to claude.ai"
Start-Sleep -Seconds 8

# Check results
$nh = Get-CimInstance Win32_Process | Where-Object { $_.CommandLine -like "*chrome-native-host*" -and $_.Name -eq "node.exe" }
Write-Host ""
if ($nh) {
    Write-Host "SUCCESS: Native host running! PID=$($nh.ProcessId)"
} else {
    Write-Host "Native host NOT running"
}
Write-Host "Pipe: $(Test-Path '\\.\pipe\claude-mcp-browser-bridge-alton')"

# Check log
Write-Host ""
Get-Content "C:\Users\alto8\AppData\Local\Claude\logs\chrome-native-host.log" -Tail 5
