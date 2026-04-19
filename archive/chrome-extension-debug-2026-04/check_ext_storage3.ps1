$ldbFile = "C:\Users\alto8\AppData\Local\Google\Chrome\User Data\Default\Local Extension Settings\fcoeoabgfenejglbffodgkkbkcdhcgfn\000005.ldb"
$bytes = [System.IO.File]::ReadAllBytes($ldbFile)
$text = [System.Text.Encoding]::UTF8.GetString($bytes)

# Find all occurrences of "bridge"
$offset = 0
while (($idx = $text.IndexOf("bridge", $offset, [StringComparison]::OrdinalIgnoreCase)) -ge 0) {
    $start = [Math]::Max(0, $idx - 50)
    $end = [Math]::Min($text.Length, $idx + 200)
    $snippet = $text.Substring($start, $end - $start) -replace '[^\x20-\x7E]', '.'
    Write-Output "=== Offset $idx ==="
    Write-Output $snippet
    Write-Output ""
    $offset = $idx + 1
}

# Also search for "paired" and "DeviceId"
foreach ($term in @("paired", "DeviceId", "DisplayName", "mcp_connected")) {
    $idx = $text.IndexOf($term, [StringComparison]::OrdinalIgnoreCase)
    if ($idx -ge 0) {
        $start = [Math]::Max(0, $idx - 50)
        $end = [Math]::Min($text.Length, $idx + 200)
        $snippet = $text.Substring($start, $end - $start) -replace '[^\x20-\x7E]', '.'
        Write-Output "=== $term at $idx ==="
        Write-Output $snippet
    }
}
