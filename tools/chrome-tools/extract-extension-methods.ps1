# Find the Chrome extension source to see what methods it handles
$extDir = "C:\Users\alto8\AppData\Local\Google\Chrome\User Data\Default\Extensions\fcoeoabgfenejglbffodgkkbkcdhcgfn"

Write-Host "=== Extension directory ==="
if (Test-Path $extDir) {
    Get-ChildItem $extDir -Recurse -Name | ForEach-Object { Write-Host "  $_" }
} else {
    Write-Host "  NOT FOUND at default location"
    # Try to find it
    Write-Host ""
    Write-Host "=== Searching for extension ==="
    $chromeExtRoot = "C:\Users\alto8\AppData\Local\Google\Chrome\User Data"
    $found = Get-ChildItem $chromeExtRoot -Recurse -Filter "manifest.json" -ErrorAction SilentlyContinue |
        Where-Object {
            $content = Get-Content $_.FullName -Raw -ErrorAction SilentlyContinue
            $content -like "*claude*" -and $content -like "*browser*"
        }
    foreach ($f in $found) {
        Write-Host "  Found: $($f.FullName)"
        $dir = $f.DirectoryName
        Get-ChildItem $dir -Name | ForEach-Object { Write-Host "    $_" }
    }
}
