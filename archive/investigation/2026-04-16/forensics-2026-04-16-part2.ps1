$ErrorActionPreference = 'SilentlyContinue'

Write-Host "=== A. Prefetch enabled? (if 0, absence of .pf is meaningless) ===" -ForegroundColor Cyan
Get-ItemProperty 'HKLM:\SYSTEM\CurrentControlSet\Control\Session Manager\Memory Management\PrefetchParameters' |
    Select-Object EnablePrefetcher, EnableSuperfetch | Format-List

Write-Host "`n=== B. When was the quarantine folder created? ===" -ForegroundColor Cyan
Get-Item 'C:\Quarantine\2026-04-16' | Select-Object FullName, CreationTime, LastWriteTime
Get-ChildItem 'C:\Quarantine\2026-04-16' | Select-Object Name, CreationTime, LastWriteTime, Length

Write-Host "`n=== C. Any other copy of the MSIX on disk? ===" -ForegroundColor Cyan
Get-ChildItem -Path 'C:\Users\alto8\Downloads', 'C:\Users\alto8\Desktop' -Filter '*rivacyBrowse*' -Recurse -ErrorAction SilentlyContinue |
    Select-Object FullName, CreationTime, LastWriteTime, Length

Write-Host "`n=== D. Edge/Chrome download history near the incident window ===" -ForegroundColor Cyan
$chromeHist = "$env:LOCALAPPDATA\Google\Chrome\User Data\Default\History"
$edgeHist   = "$env:LOCALAPPDATA\Microsoft\Edge\User Data\Default\History"
foreach ($p in $chromeHist, $edgeHist) {
    if (Test-Path $p) {
        $item = Get-Item $p
        Write-Host "  $p  (last modified: $($item.LastWriteTime))"
    } else {
        Write-Host "  $p  (not present)"
    }
}

Write-Host "`n=== E. AppXDeployment log — total events present, date range ===" -ForegroundColor Cyan
$all = Get-WinEvent -LogName 'Microsoft-Windows-AppXDeployment-Server/Operational' -MaxEvents 2000
if ($all) {
    Write-Host "  Total events in buffer: $($all.Count)"
    Write-Host "  Oldest: $($all[-1].TimeCreated)"
    Write-Host "  Newest: $($all[0].TimeCreated)"
} else {
    Write-Host "  No events (log empty or disabled)."
}

Write-Host "`n=== F. Process-creation auditing (4688) turned on? ===" -ForegroundColor Cyan
auditpol /get /subcategory:"Process Creation" 2>$null

Write-Host "`n=== G. Sysmon installed? ===" -ForegroundColor Cyan
$sysmon = Get-Service -Name 'Sysmon*' -ErrorAction SilentlyContinue
if ($sysmon) { $sysmon | Select-Object Name, Status } else { Write-Host '  No (no host-level netconn logging).' }

Write-Host "`n=== H. Any process ever connected to the C2 IPs? (live snapshot only) ===" -ForegroundColor Cyan
$suspectIPs = @('104.21.35.249','172.67.181.195')
Get-NetTCPConnection -ErrorAction SilentlyContinue |
    Where-Object { $suspectIPs -contains $_.RemoteAddress } |
    Select-Object LocalAddress, RemoteAddress, State, OwningProcess | Format-Table -AutoSize

Write-Host "`n=== I. Recent UserAssist (last-run programs) — anything PrivacyBrowse-shaped? ===" -ForegroundColor Cyan
$ua = 'HKCU:\SOFTWARE\Microsoft\Windows\CurrentVersion\Explorer\UserAssist'
Get-ChildItem $ua | ForEach-Object {
    Get-ChildItem "$($_.PSPath)\Count" -ErrorAction SilentlyContinue | ForEach-Object {
        ($_.Property | Where-Object { $_ -match 'privacy|nw\.exe|node\.exe' })
    }
} | Sort-Object -Unique
