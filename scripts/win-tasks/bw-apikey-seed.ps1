# bw-apikey-seed.ps1 - ONE-TIME interactive seeding of the Bitwarden API key
# (client_id + client_secret) into the DPAPI store. The API key lets
# bw login --apikey re-authenticate WITHOUT new-device email verification -
# the durable fix for the 2026-06-09 OTP tarpit.
#
# Where Alton gets the key: vault.bitwarden.com -> Settings -> Security ->
# Keys -> "View API key" (re-prompts master password). client_id looks like
# "user.xxxxxxxx-...", client_secret is a short random string.
#
# Run BY ALTON in an interactive console. The agent never sees the values.

$dir = "$env:LOCALAPPDATA\Sartor"
New-Item -ItemType Directory -Force $dir | Out-Null

$cid = Read-Host -Prompt "Bitwarden API client_id (user....)" -AsSecureString
$csec = Read-Host -Prompt "Bitwarden API client_secret" -AsSecureString
[PSCustomObject]@{ client_id = $cid; client_secret = $csec } | Export-Clixml -Path "$dir\bw-apikey.xml"
Write-Host "Stored. Verifying via session renewal..."

& "$PSScriptRoot\bw-session-renew.ps1"
if ($LASTEXITCODE -eq 0) {
    Write-Host "SUCCESS: API-key login + unlock + session cache all working. Renewal is fully autonomous now."
} else {
    Write-Host "VERIFICATION INCOMPLETE (rc=$LASTEXITCODE). Stored key KEPT. Log: C:\Users\alto8\backups\bw-session-renew.log"
}
