# bw-vault-seed.ps1 — ONE-TIME interactive seeding of the Bitwarden master
# password into a DPAPI-protected store for Sartor automation (uplift C2).
#
# Run BY ALTON in an interactive console (e.g. `! powershell -ExecutionPolicy
# Bypass -File scripts\win-tasks\bw-vault-seed.ps1` inside a Claude session).
# The agent never sees the value: Read-Host -AsSecureString -> Export-Clixml,
# which DPAPI-binds the blob to this Windows account on this machine.
# Immediately verifies by running bw-session-renew.ps1; on verification
# failure the seeded file is deleted so a typo can't persist.

$dir = "$env:LOCALAPPDATA\Sartor"
$masterFile = "$dir\bw-master.xml"
New-Item -ItemType Directory -Force $dir | Out-Null

$sec = Read-Host -Prompt "Bitwarden master password (stored DPAPI-encrypted for this Windows account only)" -AsSecureString
$sec | Export-Clixml -Path $masterFile
Write-Host "Stored. Verifying via session renewal..."

& "$PSScriptRoot\bw-session-renew.ps1"
if ($LASTEXITCODE -eq 0) {
    Write-Host "SUCCESS: vault unlocked, session cached. Automation is self-renewing from here."
} else {
    Remove-Item $masterFile -Force -Confirm:$false
    Write-Host "VERIFICATION FAILED (rc=$LASTEXITCODE) -seeded file deleted. Check C:\Users\alto8\backups\bw-session-renew.log and re-run."
}
