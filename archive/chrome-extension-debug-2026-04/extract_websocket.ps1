$content = Get-Content "C:\Users\alto8\AppData\Local\Google\Chrome\User Data\Default\Extensions\fcoeoabgfenejglbffodgkkbkcdhcgfn\1.0.45_0\assets\mcpPermissions-Dc4T7b96.js" -Raw

Write-Output "=== WebSocket / bridge references ==="
$matches = [regex]::Matches($content, '.{0,200}(?:WebSocket|wss://|bridge\.claude).{0,200}', 'IgnoreCase')
$i = 0
foreach ($m in $matches) {
    Write-Output "`n--- Match $i ---"
    Write-Output $m.Value
    $i++
    if ($i -ge 15) { break }
}

Write-Output "`n=== or() / connect function ==="
$matches2 = [regex]::Matches($content, '.{0,100}function\s+or\(.{0,300}', 'IgnoreCase')
foreach ($m in $matches2) {
    Write-Output $m.Value
}

Write-Output "`n=== device_id / Zt references ==="
$matches3 = [regex]::Matches($content, '.{0,150}device_id.{0,150}', 'IgnoreCase')
foreach ($m in $matches3) {
    Write-Output $m.Value
}
