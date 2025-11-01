# Webcam Capture Script for Windows
Add-Type @"
using System;
using System.Runtime.InteropServices;
using System.Drawing;
using System.Drawing.Imaging;

public class WebcamCapture {
    [DllImport("avicap32.dll")]
    public static extern IntPtr capCreateCaptureWindowA(string lpszWindowName, int dwStyle, int x, int y, int nWidth, int nHeight, IntPtr hWndParent, int nID);

    [DllImport("user32.dll")]
    public static extern bool SendMessage(IntPtr hWnd, uint Msg, IntPtr wParam, IntPtr lParam);

    [DllImport("user32.dll")]
    public static extern bool DestroyWindow(IntPtr hWnd);

    public const int WM_CAP_CONNECT = 0x40A;
    public const int WM_CAP_DISCONNECT = 0x40B;
    public const int WM_CAP_GRAB_FRAME = 0x43C;
    public const int WM_CAP_COPY = 0x41E;
    public const int WM_CAP_GET_FRAME = 0x43C;
    public const int WM_CAP_SAVEDIB = 0x419;
}
"@

$savePath = "\\wsl$\Ubuntu\home\alton\vayu-learning-project\webcam-photo.bmp"
$hWnd = [WebcamCapture]::capCreateCaptureWindowA("WebcamCapture", 0, 0, 0, 640, 480, [IntPtr]::Zero, 0)

if ($hWnd -ne [IntPtr]::Zero) {
    [WebcamCapture]::SendMessage($hWnd, [WebcamCapture]::WM_CAP_CONNECT, 0, [IntPtr]::Zero) | Out-Null
    Start-Sleep -Milliseconds 1000
    [WebcamCapture]::SendMessage($hWnd, [WebcamCapture]::WM_CAP_GRAB_FRAME, [IntPtr]::Zero, [IntPtr]::Zero) | Out-Null

    $pathPtr = [System.Runtime.InteropServices.Marshal]::StringToHGlobalAnsi($savePath)
    [WebcamCapture]::SendMessage($hWnd, [WebcamCapture]::WM_CAP_SAVEDIB, [IntPtr]::Zero, $pathPtr) | Out-Null
    [System.Runtime.InteropServices.Marshal]::FreeHGlobal($pathPtr)

    [WebcamCapture]::SendMessage($hWnd, [WebcamCapture]::WM_CAP_DISCONNECT, [IntPtr]::Zero, [IntPtr]::Zero) | Out-Null
    [WebcamCapture]::DestroyWindow($hWnd) | Out-Null

    Write-Host "Photo captured to: $savePath"
} else {
    Write-Host "Failed to create capture window"
}
