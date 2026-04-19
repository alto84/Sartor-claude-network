Add-Type -AssemblyName System.Windows.Forms
Add-Type @"
using System;
using System.Runtime.InteropServices;
public class WinAPI2 {
    [DllImport("user32.dll")]
    public static extern IntPtr FindWindow(string lpClassName, string lpWindowName);
    [DllImport("user32.dll")]
    public static extern bool SetForegroundWindow(IntPtr hWnd);
    [DllImport("user32.dll", CharSet = CharSet.Auto)]
    public static extern int GetWindowText(IntPtr hWnd, System.Text.StringBuilder lpString, int nMaxCount);
}
"@

$chromeProcs = Get-Process chrome -ErrorAction SilentlyContinue | Where-Object { $_.MainWindowHandle -ne [IntPtr]::Zero }
foreach ($proc in $chromeProcs) {
    $sb = New-Object System.Text.StringBuilder(256)
    [WinAPI2]::GetWindowText($proc.MainWindowHandle, $sb, 256) | Out-Null
    $title = $sb.ToString()
    if ($title -like "*Claude*" -or $title -like "*chrome*" -or $title -like "*Google*") {
        Write-Host "Sending F5 to: '$title'"
        [WinAPI2]::SetForegroundWindow($proc.MainWindowHandle) | Out-Null
        Start-Sleep -Milliseconds 300
        [System.Windows.Forms.SendKeys]::SendWait("{F5}")
        break
    }
}

# Wait for native host to start
for ($i = 0; $i -lt 10; $i++) {
    Start-Sleep -Seconds 1
    $nh = Get-CimInstance Win32_Process | Where-Object { $_.CommandLine -like "*chrome-native-host*" -and $_.Name -eq "node.exe" }
    $pipeExists = Test-Path "\\.\pipe\claude-mcp-browser-bridge-alton"
    Write-Host "[$i] Native host: $(if($nh){'RUNNING'}else{'waiting...'}) | Pipe: $pipeExists"
    if ($nh -and $pipeExists) {
        Write-Host "Ready!"
        break
    }
}
