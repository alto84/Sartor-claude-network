# Find the socket bridge client that connects to the named pipe
$cliPath = "C:\Users\alto8\AppData\Roaming\npm\node_modules\@anthropic-ai\claude-code\cli.js"
$content = Get-Content $cliPath -Raw

# Find Qzq - the socket bridge factory
$idx = $content.IndexOf("function Qzq(")
if ($idx -ge 0) {
    $end = [Math]::Min($content.Length, $idx + 5000)
    Write-Host "=== Qzq (socket bridge factory) ==="
    Write-Host $content.Substring($idx, $end - $idx)
    Write-Host ""
} else {
    # Try as var/class
    $patterns = @("Qzq=", "class Qzq")
    foreach ($p in $patterns) {
        $idx = $content.IndexOf($p)
        if ($idx -ge 0) {
            $start = [Math]::Max(0, $idx - 50)
            $end = [Math]::Min($content.Length, $idx + 5000)
            Write-Host "=== Qzq ($p, offset $idx) ==="
            Write-Host $content.Substring($start, $end - $start)
            Write-Host ""
            break
        }
    }
}

# Find Bzq - the disconnected handler
$idx2 = $content.IndexOf("function Bzq(")
if ($idx2 -lt 0) { $idx2 = $content.IndexOf("Bzq=") }
if ($idx2 -ge 0) {
    $start = [Math]::Max(0, $idx2 - 100)
    $end = [Math]::Min($content.Length, $idx2 + 500)
    Write-Host "=== Bzq (disconnected handler) ==="
    Write-Host $content.Substring($start, $end - $start)
    Write-Host ""
}

# Find mzq - the tool execution function
$idx3 = $content.IndexOf("function mzq(")
if ($idx3 -lt 0) { $idx3 = $content.IndexOf("async function mzq(") }
if ($idx3 -ge 0) {
    $end = [Math]::Min($content.Length, $idx3 + 3000)
    Write-Host "=== mzq (tool execution) ==="
    Write-Host $content.Substring($idx3, $end - $idx3)
}
