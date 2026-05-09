Add-Type @"
using System;
using System.Runtime.InteropServices;

public class WindowHelper {
    [DllImport("user32.dll")]
    public static extern bool SetForegroundWindow(IntPtr hWnd);

    [DllImport("user32.dll")]
    public static extern bool ShowWindow(IntPtr hWnd, int nCmdShow);

    [DllImport("user32.dll")]
    public static extern bool IsIconic(IntPtr hWnd);

    public const int SW_RESTORE = 9;
    public const int SW_SHOW = 5;
}
"@

try {
    $chromeProcs = Get-Process -Name "chrome" -ErrorAction SilentlyContinue |
        Where-Object { $_.MainWindowHandle -ne [IntPtr]::Zero -and $_.MainWindowTitle -ne "" }

    if (-not $chromeProcs -or $chromeProcs.Count -eq 0) {
        Write-Error "No Chrome window found. Is Chrome running?"
        exit 1
    }

    # Pick the first Chrome window with a title (main browser window)
    $chrome = $chromeProcs | Select-Object -First 1
    $hwnd = $chrome.MainWindowHandle

    # If minimized, restore it first
    if ([WindowHelper]::IsIconic($hwnd)) {
        [WindowHelper]::ShowWindow($hwnd, [WindowHelper]::SW_RESTORE) | Out-Null
    }
    else {
        [WindowHelper]::ShowWindow($hwnd, [WindowHelper]::SW_SHOW) | Out-Null
    }

    Start-Sleep -Milliseconds 100

    $result = [WindowHelper]::SetForegroundWindow($hwnd)
    if ($result) {
        Write-Output "Chrome window brought to foreground: '$($chrome.MainWindowTitle)'"
    }
    else {
        Write-Error "SetForegroundWindow returned false. Chrome may not have been activated."
        exit 1
    }
}
catch {
    Write-Error "Failed to focus Chrome: $_"
    exit 1
}
