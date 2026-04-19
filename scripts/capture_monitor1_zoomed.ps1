Add-Type -AssemblyName System.Windows.Forms
Add-Type -AssemblyName System.Drawing
$screens = [System.Windows.Forms.Screen]::AllScreens
$s = $screens[1]
$b = $s.Bounds
$bitmap = New-Object System.Drawing.Bitmap($b.Width, $b.Height)
$graphics = [System.Drawing.Graphics]::FromImage($bitmap)
$graphics.CopyFromScreen($b.Location, [System.Drawing.Point]::Empty, $b.Size)
$bitmap.Save("C:\Users\alto8\monitor1_fresh.png")
$graphics.Dispose()
$bitmap.Dispose()
Write-Host "Saved"
