# Extract tool_request handling from service worker
$swPath = "C:\Users\alto8\AppData\Local\Google\Chrome\User Data\Default\Extensions\fcoeoabgfenejglbffodgkkbkcdhcgfn\1.0.45_0\assets\service-worker.ts-ASGIJ2db.js"
$content = Get-Content $swPath -Raw

# Find tool_request handling
$idx = $content.IndexOf("tool_request")
if ($idx -ge 0) {
    $start = [Math]::Max(0, $idx - 500)
    $end = [Math]::Min($content.Length, $idx + 3000)
    Write-Host "=== tool_request handler (offset $idx) ==="
    Write-Host $content.Substring($start, $end - $start)
    Write-Host ""
}

# Find "Unknown method" in SW
$idx2 = $content.IndexOf("Unknown method")
if ($idx2 -ge 0) {
    $start = [Math]::Max(0, $idx2 - 1000)
    $end = [Math]::Min($content.Length, $idx2 + 500)
    Write-Host "=== Unknown method (offset $idx2) ==="
    Write-Host $content.Substring($start, $end - $start)
} else {
    Write-Host "  'Unknown method' NOT found in service worker"
}

# Check the client.js for method definitions
$clientPath = "C:\Users\alto8\AppData\Local\Google\Chrome\User Data\Default\Extensions\fcoeoabgfenejglbffodgkkbkcdhcgfn\1.0.45_0\assets\client-Dwy-xcQD.js"
if (Test-Path $clientPath) {
    $clientContent = Get-Content $clientPath -Raw
    $idx3 = $clientContent.IndexOf("Unknown method")
    if ($idx3 -ge 0) {
        $start = [Math]::Max(0, $idx3 - 1500)
        $end = [Math]::Min($clientContent.Length, $idx3 + 500)
        Write-Host ""
        Write-Host "=== Unknown method in client.js (offset $idx3) ==="
        Write-Host $clientContent.Substring($start, $end - $start)
    }
}
