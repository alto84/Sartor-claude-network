$target = 'C:\Users\alto8\static-analysis-2026-04-16'
if (Test-Path $target) {
    $items = Get-ChildItem $target -Recurse -Force -ErrorAction SilentlyContinue
    $count = $items.Count
    $size  = ($items | Measure-Object Length -Sum).Sum
    Write-Host ("Pre-delete: {0} files, {1:N0} bytes" -f $count, $size)
    Remove-Item $target -Recurse -Force
    if (Test-Path $target) { Write-Host 'FAILED to delete.' } else { Write-Host 'Deleted cleanly.' }
} else {
    Write-Host 'Already gone.'
}

Write-Host ''
Write-Host '=== Remaining related artifacts ==='
$paths = @(
    'C:\Quarantine\2026-04-16',
    'C:\Users\alto8\evidence-privacybrowse-2026-04-16-185957',
    'C:\Users\alto8\forensics-2026-04-16.ps1',
    'C:\Users\alto8\forensics-2026-04-16-part2.ps1',
    'C:\Users\alto8\forensics-2026-04-16-part3.ps1',
    'C:\Users\alto8\whatsapp-verify.ps1'
)
foreach ($p in $paths) {
    if (Test-Path $p) {
        $item = Get-Item $p
        if ($item.PSIsContainer) {
            $sz = (Get-ChildItem $p -Recurse -Force | Measure-Object Length -Sum).Sum
            Write-Host ("  [dir]  {0}  ({1:N0} bytes)" -f $p, $sz)
        } else {
            Write-Host ("  [file] {0}  ({1:N0} bytes)" -f $p, $item.Length)
        }
    }
}
