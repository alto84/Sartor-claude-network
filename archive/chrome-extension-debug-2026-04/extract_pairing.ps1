$content = Get-Content "C:\Users\alto8\AppData\Local\Google\Chrome\User Data\Default\Extensions\fcoeoabgfenejglbffodgkkbkcdhcgfn\1.0.45_0\assets\mcpPermissions-Dc4T7b96.js" -Raw
# Extract sections around "pairing"
$matches = [regex]::Matches($content, '.{0,200}pairing.{0,200}', 'IgnoreCase')
Write-Output "=== Found $($matches.Count) pairing references ==="
$i = 0
foreach ($m in $matches) {
    Write-Output "`n--- Match $i ---"
    Write-Output $m.Value
    $i++
}

Write-Output "`n=== mcp_client references ==="
$matches2 = [regex]::Matches($content, '.{0,150}mcp_client.{0,150}', 'IgnoreCase')
foreach ($m in $matches2) {
    Write-Output $m.Value
}

Write-Output "`n=== pair_request / pairing_request ==="
$matches3 = [regex]::Matches($content, '.{0,200}pair(?:ing)?_(?:request|confirm|response|dismiss).{0,200}', 'IgnoreCase')
foreach ($m in $matches3) {
    Write-Output $m.Value
}
