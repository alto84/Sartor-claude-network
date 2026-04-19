$ErrorActionPreference = 'SilentlyContinue'

Write-Host "=== 1. MSIX deployment events mentioning PrivacyBrowse ===" -ForegroundColor Cyan
Get-WinEvent -LogName 'Microsoft-Windows-AppXDeployment-Server/Operational' -MaxEvents 500 |
    Where-Object { $_.Message -match 'privacybrowse' } |
    Select-Object TimeCreated, Id, @{n='Msg';e={ $_.Message.Substring(0, [Math]::Min(220, $_.Message.Length)) }} |
    Format-List

Write-Host "`n=== 2. Defender events mentioning PrivacyBrowse / pbcdn ===" -ForegroundColor Cyan
Get-WinEvent -LogName 'Microsoft-Windows-Windows Defender/Operational' -MaxEvents 1000 |
    Where-Object { $_.Message -match 'privacybrowse|pbcdn' } |
    Select-Object TimeCreated, Id, @{n='Msg';e={ $_.Message.Substring(0, [Math]::Min(300, $_.Message.Length)) }} |
    Format-List

Write-Host "`n=== 3. Prefetch entries (any related binaries) ===" -ForegroundColor Cyan
Get-ChildItem 'C:\Windows\Prefetch\' -Filter '*.pf' |
    Where-Object { $_.Name -match 'PRIVACY|^NW\.EXE|^NODE\.EXE' } |
    Select-Object Name, LastWriteTime, Length

Write-Host "`n=== 4. Is the AppX package still installed? ===" -ForegroundColor Cyan
$pkg = Get-AppxPackage -Name '*PrivacyBrowse*'
if ($pkg) { $pkg | Select-Object Name, InstallLocation, PackageFullName } else { Write-Host 'Not installed (good).' }

Write-Host "`n=== 5. AppX activation log (did it ever launch?) ===" -ForegroundColor Cyan
Get-WinEvent -LogName 'Microsoft-Windows-TWinUI/Operational' -MaxEvents 500 |
    Where-Object { $_.Message -match 'privacybrowse' } |
    Select-Object TimeCreated, Id, @{n='Msg';e={ $_.Message.Substring(0, [Math]::Min(220, $_.Message.Length)) }} |
    Format-List

Write-Host "`n=== 6. Windows Firewall logging enabled? ===" -ForegroundColor Cyan
Get-NetFirewallProfile | Select-Object Name, LogFileName, LogAllowed, LogBlocked, LogIgnored | Format-Table -AutoSize

Write-Host "`n=== 7. DNS Client cache (live snapshot, may have aged out) ===" -ForegroundColor Cyan
ipconfig /displaydns | Select-String -Pattern 'privacybrowse|pbcdn' -Context 0,5

Write-Host "`n=== 8. Defender recent detection summary (last 7d) ===" -ForegroundColor Cyan
Get-MpThreatDetection | Where-Object { $_.InitialDetectionTime -gt (Get-Date).AddDays(-7) } |
    Select-Object InitialDetectionTime, ThreatID, @{n='Resources';e={ $_.Resources -join '; ' }} |
    Format-List

Write-Host "`n=== 9. MpThreat history for PrivacyBrowse ===" -ForegroundColor Cyan
Get-MpThreat | Where-Object { $_.ThreatName -match 'privacy|pua' -or $_.Resources -match 'privacybrowse' } |
    Select-Object ThreatName, SeverityID, CategoryID | Format-List

Write-Host "`n=== 10. Currently listening / established connections to suspect host ===" -ForegroundColor Cyan
Resolve-DnsName -Name 'pbcdn.privacybrowse.app' -ErrorAction SilentlyContinue |
    Select-Object Name, IPAddress, Type | Format-Table -AutoSize
