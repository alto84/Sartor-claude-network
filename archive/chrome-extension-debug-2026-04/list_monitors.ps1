Add-Type -AssemblyName System.Windows.Forms
$screens = [System.Windows.Forms.Screen]::AllScreens
$i = 0
foreach ($s in $screens) {
    Write-Host "Monitor $i : $($s.DeviceName) | Primary=$($s.Primary) | X=$($s.Bounds.X) Y=$($s.Bounds.Y) W=$($s.Bounds.Width) H=$($s.Bounds.Height)"
    $i++
}
Write-Host "Total: $($screens.Count)"
