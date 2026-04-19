$target = 'C:\Users\alto8\Downloads\WhatsApp Installer.exe'

Write-Host "===== 1. AUTHENTICODE SIGNATURE ====="
if (Test-Path $target) {
    Get-AuthenticodeSignature $target | Format-List *
} else {
    Write-Host "TARGET FILE NOT FOUND: $target"
}

Write-Host ""
Write-Host "===== 2. SHA256 HASH ====="
if (Test-Path $target) {
    Get-FileHash -Algorithm SHA256 $target | Format-List *
}

Write-Host ""
Write-Host "===== 3. PE VERSION INFO ====="
if (Test-Path $target) {
    (Get-Item $target).VersionInfo | Format-List *
}

Write-Host ""
Write-Host "===== 4. SIZE / TIMESTAMPS / MZ HEADER ====="
if (Test-Path $target) {
    Get-Item $target | Select-Object Length, LastWriteTime, CreationTime | Format-List *
    $bytes = [System.IO.File]::ReadAllBytes($target)[0..1]
    $magic = [System.Text.Encoding]::ASCII.GetString($bytes)
    Write-Host "First 2 bytes (ASCII): '$magic'"
    Write-Host "First 2 bytes (hex): $('{0:X2} {1:X2}' -f $bytes[0], $bytes[1])"
}

Write-Host ""
Write-Host "===== 5. RECENT DOWNLOADS (last 72h) ====="
$cutoff = (Get-Date).AddHours(-72)
Get-ChildItem 'C:\Users\alto8\Downloads\' | Where-Object { $_.LastWriteTime -gt $cutoff } | Sort-Object LastWriteTime -Descending | Format-Table Name, Length, LastWriteTime -AutoSize
