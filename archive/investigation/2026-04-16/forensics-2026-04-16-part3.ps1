$ErrorActionPreference = 'SilentlyContinue'

Write-Host "=== Quarantine folder listing ===" -ForegroundColor Cyan
Get-ChildItem 'C:\Quarantine\2026-04-16' -Recurse | Select-Object FullName, Length, CreationTime | Format-Table -AutoSize -Wrap

Write-Host ""
Write-Host "=== AppXDeployment log date range ===" -ForegroundColor Cyan
$all = Get-WinEvent -LogName 'Microsoft-Windows-AppXDeployment-Server/Operational' -MaxEvents 2000
if ($all) {
    Write-Host ("Total events: {0}" -f $all.Count)
    Write-Host ("Oldest:       {0}" -f $all[-1].TimeCreated)
    Write-Host ("Newest:       {0}" -f $all[0].TimeCreated)
} else { Write-Host "No events." }

Write-Host ""
Write-Host "=== Sysmon ===" -ForegroundColor Cyan
$sysmon = Get-Service -Name 'Sysmon*'
if ($sysmon) { $sysmon | Select-Object Name, Status } else { Write-Host "Not installed." }

Write-Host ""
Write-Host "=== Live connections to C2 IPs ===" -ForegroundColor Cyan
$suspectIPs = @('104.21.35.249','172.67.181.195')
$hits = Get-NetTCPConnection | Where-Object { $suspectIPs -contains $_.RemoteAddress }
if ($hits) { $hits | Format-Table -AutoSize } else { Write-Host "None." }

Write-Host ""
Write-Host "=== Chrome history lookup ===" -ForegroundColor Cyan
$src = Join-Path $env:LOCALAPPDATA 'Google\Chrome\User Data\Default\History'
$tmp = Join-Path $env:TEMP ("chrome_hist_{0}.db" -f (Get-Random))
Copy-Item -Path $src -Destination $tmp -Force

$sqliteCmd = Get-Command sqlite3.exe -ErrorAction SilentlyContinue
if (-not $sqliteCmd) {
    Write-Host "sqlite3.exe not found. Trying Python fallback..."
    $py = Get-Command python.exe -ErrorAction SilentlyContinue
    if (-not $py) { Write-Host "No python either. Skipping Chrome queries."; return }

    $pyScript = @'
import sqlite3, sys, datetime
db = sys.argv[1]
con = sqlite3.connect(db)
cur = con.cursor()
def ts(v):
    return datetime.datetime(1601,1,1) + datetime.timedelta(microseconds=v) if v else None
print("--- urls table ---")
for row in cur.execute("SELECT last_visit_time, visit_count, url FROM urls WHERE url LIKE ? OR url LIKE ? ORDER BY last_visit_time DESC LIMIT 200", ("%privacybrowse%","%pbcdn%")):
    print(ts(row[0]), "visits=%s" % row[1], row[2])
print("--- downloads ---")
for row in cur.execute("SELECT start_time, target_path, tab_url, referrer, received_bytes FROM downloads WHERE target_path LIKE ? OR tab_url LIKE ? OR referrer LIKE ? ORDER BY start_time DESC", ("%rivacyBrowse%","%privacybrowse%","%privacybrowse%")):
    print(ts(row[0]), row[1], "bytes=%s" % row[4], "tab=%s" % row[2], "ref=%s" % row[3])
print("--- any download in last 24h (context) ---")
cutoff = (datetime.datetime.utcnow() - datetime.datetime(1601,1,1)).total_seconds() * 1_000_000 - 86400*1_000_000
for row in cur.execute("SELECT start_time, target_path, tab_url FROM downloads WHERE start_time > ? ORDER BY start_time DESC LIMIT 50", (int(cutoff),)):
    print(ts(row[0]), row[1], "tab=%s" % row[2])
con.close()
'@
    $pyFile = Join-Path $env:TEMP "chrome_query.py"
    Set-Content -Path $pyFile -Value $pyScript -Encoding UTF8
    & python.exe $pyFile $tmp
    Remove-Item $pyFile -Force
} else {
    $sql = @'
.mode list
.headers on
SELECT datetime(last_visit_time/1000000-11644473600,'unixepoch','localtime') AS ts, visit_count, url FROM urls WHERE url LIKE '%privacybrowse%' OR url LIKE '%pbcdn%' ORDER BY last_visit_time DESC LIMIT 200;
SELECT datetime(start_time/1000000-11644473600,'unixepoch','localtime') AS ts, target_path, tab_url, referrer, received_bytes FROM downloads WHERE target_path LIKE '%rivacyBrowse%' OR tab_url LIKE '%privacybrowse%' OR referrer LIKE '%privacybrowse%' ORDER BY start_time DESC;
'@
    $sqlFile = Join-Path $env:TEMP "chrome_query.sql"
    Set-Content -Path $sqlFile -Value $sql -Encoding ASCII
    & sqlite3.exe $tmp ".read $sqlFile"
    Remove-Item $sqlFile -Force
}
Remove-Item $tmp -Force -ErrorAction SilentlyContinue
