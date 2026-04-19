Add-Type -AssemblyName System.Windows.Forms
Add-Type -AssemblyName System.Drawing

# Capture all monitors
$screens = [System.Windows.Forms.Screen]::AllScreens
$i = 0
foreach ($s in $screens) {
    $b = $s.Bounds
    $bitmap = New-Object System.Drawing.Bitmap($b.Width, $b.Height)
    $graphics = [System.Drawing.Graphics]::FromImage($bitmap)
    $graphics.CopyFromScreen($b.Location, [System.Drawing.Point]::Empty, $b.Size)
    $bitmap.Save("C:\Users\alto8\screen_$i.png")
    $graphics.Dispose()
    $bitmap.Dispose()
    $i++
}
Write-Host "Captured $i monitors"
