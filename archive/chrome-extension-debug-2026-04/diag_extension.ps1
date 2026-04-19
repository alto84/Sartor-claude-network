# Find the Chrome extension source
$extBase = "C:\Users\alto8\AppData\Local\Google\Chrome\User Data\Default\Extensions\fcoeoabgfenejglbffodgkkbkcdhcgfn"
if (Test-Path $extBase) {
    Write-Output "=== Extension versions ==="
    Get-ChildItem $extBase -Directory | ForEach-Object { Write-Output "  $($_.Name)" }

    # Get latest version
    $latest = Get-ChildItem $extBase -Directory | Sort-Object Name -Descending | Select-Object -First 1
    Write-Output "`n=== Manifest ($($latest.Name)) ==="
    $manifest = Get-Content "$($latest.FullName)\manifest.json" -Raw
    Write-Output $manifest

    Write-Output "`n=== Extension files ==="
    Get-ChildItem $latest.FullName -Recurse -File | ForEach-Object {
        Write-Output "  $($_.FullName.Substring($latest.FullName.Length)) ($($_.Length) bytes)"
    }
} else {
    Write-Output "Extension not found at $extBase"
    # Search for it
    Get-ChildItem "C:\Users\alto8\AppData\Local\Google\Chrome\User Data" -Recurse -Filter "manifest.json" -ErrorAction SilentlyContinue |
        Where-Object { (Get-Content $_.FullName -Raw) -match "claude" } |
        Select-Object -First 3 | ForEach-Object { Write-Output "Found: $($_.FullName)" }
}
