Add-Type -AssemblyName System.Windows.Forms
Add-Type -AssemblyName System.Drawing
# Chrome extension area on monitor 1 - right side of toolbar
# Monitor 1 starts at x=2560, y=159
$x = 2560 + 1100
$y = 159
$width = 820
$height = 70
$bitmap = New-Object System.Drawing.Bitmap($width, $height)
$graphics = [System.Drawing.Graphics]::FromImage($bitmap)
$graphics.CopyFromScreen($x, $y, 0, 0, (New-Object System.Drawing.Size($width, $height)))
$bitmap.Save("C:\Users\alto8\toolbar_zoom.png", [System.Drawing.Imaging.ImageFormat]::Png)
$graphics.Dispose()
$bitmap.Dispose()
Write-Output "Saved toolbar zoom"
