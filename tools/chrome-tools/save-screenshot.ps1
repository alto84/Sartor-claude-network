# Extract base64 from the screenshot response and save
$resultFile = "C:\Users\alto8\.claude\projects\C--Users-alto8\d289409b-b72f-4420-8602-426249fc9dc9\tool-results\toolu_01TPGA8DpyoQL5eunnuM9JBL.txt"
$content = Get-Content $resultFile -Raw

# Find base64 data between "data":" and the next quote
$pattern = '"data":"([A-Za-z0-9+/=]+)"'
if ($content -match $pattern) {
    $base64 = $Matches[1]
    $bytes = [Convert]::FromBase64String($base64)
    $outPath = "C:\Users\alto8\chrome-tools\ext-screenshot-hn.jpg"
    [System.IO.File]::WriteAllBytes($outPath, $bytes)
    Write-Host "Saved screenshot: $outPath ($($bytes.Length) bytes)"
} else {
    Write-Host "Could not find base64 data"
}
