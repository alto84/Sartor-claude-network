# bw-apikey-seed-fromfile.ps1 - seed the Bitwarden API key from a transfer
# file Alton wrote (e.g. Desktop\secrets.txt with the web vault's "OAuth 2.0
# Client Credentials" block). Values are parsed locally, DPAPI-stored, and
# NEVER printed; on successful verification the plaintext transfer file is
# overwritten and deleted. Agent-runnable: no interactive prompts.
#
# Usage: powershell -File bw-apikey-seed-fromfile.ps1 -Path C:\...\secrets.txt

param([Parameter(Mandatory=$true)][string]$Path)

if (-not (Test-Path $Path)) { Write-Output "FAIL: transfer file not found"; exit 2 }

$lines = Get-Content $Path | ForEach-Object { $_.Trim() } | Where-Object { $_ }
$cid = $null; $csec = $null
for ($i = 0; $i -lt $lines.Count; $i++) {
    if ($lines[$i] -match '^client_id:?\s*$' -and $i + 1 -lt $lines.Count) { $cid = $lines[$i + 1] }
    elseif ($lines[$i] -match '^client_id:?\s*(\S.*)$') { $cid = $Matches[1] }
    if ($lines[$i] -match '^client_secret:?\s*$' -and $i + 1 -lt $lines.Count) { $csec = $lines[$i + 1] }
    elseif ($lines[$i] -match '^client_secret:?\s*(\S.*)$') { $csec = $Matches[1] }
}

if (-not $cid -or $cid -notlike 'user.*') { Write-Output "FAIL: could not parse a client_id (expected 'user.*')"; exit 3 }
if (-not $csec) { Write-Output "FAIL: could not parse a client_secret"; exit 3 }
Write-Output ("parsed: client_id user.<{0} chars>, client_secret <{1} chars>" -f ($cid.Length - 5), $csec.Length)

$dir = "$env:LOCALAPPDATA\Sartor"
New-Item -ItemType Directory -Force $dir | Out-Null
$cidSec = ConvertTo-SecureString $cid -AsPlainText -Force
$csecSec = ConvertTo-SecureString $csec -AsPlainText -Force
$cid = $null; $csec = $null
[PSCustomObject]@{ client_id = $cidSec; client_secret = $csecSec } | Export-Clixml -Path "$dir\bw-apikey.xml"
Write-Output "stored DPAPI-encrypted. Verifying via session renewal..."

& "$PSScriptRoot\bw-session-renew.ps1"
$rc = $LASTEXITCODE
if ($rc -eq 0) {
    # Overwrite then delete the plaintext transfer file.
    Set-Content -Path $Path -Value ('x' * 4096) -Encoding ascii
    Remove-Item $Path -Force -Confirm:$false
    Write-Output "SUCCESS: API-key login + unlock + session cached. Transfer file overwritten and deleted."
    exit 0
}
Write-Output "VERIFICATION INCOMPLETE (rc=$rc). Key KEPT; transfer file LEFT IN PLACE. Log: C:\Users\alto8\backups\bw-session-renew.log"
exit $rc
