$content = Get-Content "C:\Users\alto8\AppData\Local\Google\Chrome\User Data\Default\Extensions\fcoeoabgfenejglbffodgkkbkcdhcgfn\1.0.45_0\assets\mcpPermissions-Dc4T7b96.js" -Raw

Write-Output "=== chrome_ext_bridge_enabled feature flag ==="
$matches = [regex]::Matches($content, '.{0,200}chrome_ext_bridge_enabled.{0,200}', 'IgnoreCase')
foreach ($m in $matches) { Write-Output $m.Value }

Write-Output "`n=== localBridge references ==="
$matches2 = [regex]::Matches($content, '.{0,200}localBridge.{0,200}', 'IgnoreCase')
foreach ($m in $matches2) { Write-Output $m.Value }

Write-Output "`n=== OAuth token fetch (e() function context) ==="
# Find where oauth_token is used in the connect flow
$matches3 = [regex]::Matches($content, '.{0,200}oauth_token.{0,200}', 'IgnoreCase')
foreach ($m in $matches3) { Write-Output $m.Value }

Write-Output "`n=== g() function - session/org ID ==="
$matches4 = [regex]::Matches($content, '.{0,200}function\s+g\(\).{0,200}', 'IgnoreCase')
foreach ($m in $matches4) { Write-Output $m.Value }
