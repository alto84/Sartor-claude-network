# Read the extension's LevelDB storage to check feature flags and bridge state
$dbPath = "C:\Users\alto8\AppData\Local\Google\Chrome\User Data\Default\Local Extension Settings\fcoeoabgfenejglbffodgkkbkcdhcgfn\000004.log"
if (Test-Path $dbPath) {
    # Extract readable strings from the LevelDB log
    $bytes = [System.IO.File]::ReadAllBytes($dbPath)
    $text = [System.Text.Encoding]::UTF8.GetString($bytes)

    # Search for relevant keys
    $patterns = @("bridge", "pairing", "paired", "device_id", "display_name", "feature", "oauth", "mcp_connected", "bridgeDeviceId", "bridgeDisplayName", "chrome_ext_bridge")
    foreach ($p in $patterns) {
        $idx = $text.IndexOf($p, [StringComparison]::OrdinalIgnoreCase)
        if ($idx -ge 0) {
            $start = [Math]::Max(0, $idx - 20)
            $end = [Math]::Min($text.Length, $idx + 100)
            $snippet = $text.Substring($start, $end - $start) -replace '[^\x20-\x7E]', '.'
            Write-Output "${p}: ...${snippet}..."
        } else {
            Write-Output "${p}: NOT FOUND"
        }
    }
}
