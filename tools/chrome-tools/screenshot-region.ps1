param(
    [Parameter(Mandatory=$true)][int]$X,
    [Parameter(Mandatory=$true)][int]$Y,
    [Parameter(Mandatory=$true)][int]$Width,
    [Parameter(Mandatory=$true)][int]$Height,
    [string]$Output = "C:\Users\alto8\chrome-tools\region_capture.png"
)

Add-Type -AssemblyName System.Drawing

if ($Width -le 0 -or $Height -le 0) {
    Write-Error "Width and Height must be positive integers."
    exit 1
}

try {
    $bmp = New-Object System.Drawing.Bitmap($Width, $Height)
    $gfx = [System.Drawing.Graphics]::FromImage($bmp)
    $gfx.CopyFromScreen($X, $Y, 0, 0, (New-Object System.Drawing.Size($Width, $Height)))
    $gfx.Dispose()
    $bmp.Save($Output, [System.Drawing.Imaging.ImageFormat]::Png)
    $bmp.Dispose()
    Write-Output "Captured region ($X, $Y) ${Width}x${Height} -> $Output"
}
catch {
    Write-Error "Failed to capture region: $_"
    exit 1
}
