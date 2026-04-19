# Try the .ldb file which Chrome may not have locked
$dbDir = "C:\Users\alto8\AppData\Local\Google\Chrome\User Data\Default\Local Extension Settings\fcoeoabgfenejglbffodgkkbkcdhcgfn"
Get-ChildItem $dbDir -File | ForEach-Object {
    try {
        $bytes = [System.IO.File]::ReadAllBytes($_.FullName)
        $text = [System.Text.Encoding]::UTF8.GetString($bytes)
        $patterns = @("bridge", "paired", "deviceId", "displayName", "feature_flag", "chrome_ext_bridge")
        foreach ($p in $patterns) {
            $idx = $text.IndexOf($p, [StringComparison]::OrdinalIgnoreCase)
            if ($idx -ge 0) {
                $start = [Math]::Max(0, $idx - 30)
                $end = [Math]::Min($text.Length, $idx + 150)
                $snippet = $text.Substring($start, $end - $start) -replace '[^\x20-\x7E]', '.'
                Write-Output "$($_.Name) | ${p}: $snippet"
            }
        }
    } catch {
        Write-Output "$($_.Name): LOCKED/ERROR"
    }
}
