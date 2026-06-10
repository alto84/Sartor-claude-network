# bw-session-renew.ps1 — keep the Bitwarden CLI session alive for Sartor automation.
#
# Design (2026-06-09, uplift C2-structural):
#   - Master password lives DPAPI-protected at %LOCALAPPDATA%\Sartor\bw-master.xml
#     (SecureString Export-Clixml; decryptable only by this Windows account on this
#     machine). Seeded once, interactively, by Alton via bw-vault-seed.ps1.
#   - This script: if the cached session still works, exit quietly. Otherwise
#     re-login (if needed) and re-unlock using the DPAPI password, cache the new
#     session token where sartor-secret expects it, and bw sync.
#   - Runs as scheduled task "Sartor Vault Session Renew" (logon + every 4h).
#   - Secrets NEVER hit stdout, the log, or the command line (passwordenv only).
#
# Exit codes: 0 ok | 2 not seeded | 3 unlock failed | 4 login failed (2FA? see note)

$ErrorActionPreference = 'Continue'
$dir = "$env:LOCALAPPDATA\Sartor"
$sessionFile = "$dir\bw-session"
$masterFile = "$dir\bw-master.xml"
$log = "C:\Users\alto8\backups\bw-session-renew.log"

function Log($m) { Add-Content -Path $log -Value ("{0} {1}" -f (Get-Date -Format s), $m) }

# 1. If the cached session is still valid, we're done.
if (Test-Path $sessionFile) {
    $env:BW_SESSION = (Get-Content $sessionFile -Raw).Trim()
    $s = (bw status 2>$null | ConvertFrom-Json).status
    if ($s -eq 'unlocked') { Log "ok (cached session valid)"; exit 0 }
}

# 2. Need the master password.
if (-not (Test-Path $masterFile)) {
    Log "FAIL: no DPAPI master file at $masterFile -run bw-vault-seed.ps1 once"
    exit 2
}
$sec = Import-Clixml $masterFile
$bstr = [Runtime.InteropServices.Marshal]::SecureStringToBSTR($sec)
$env:BW_PASSWORD = [Runtime.InteropServices.Marshal]::PtrToStringBSTR($bstr)
[Runtime.InteropServices.Marshal]::ZeroFreeBSTR($bstr)

try {
    # 3. Re-authenticate if the CLI is fully logged out. Prefer the API key
    #    (bw login --apikey skips new-device email verification entirely —
    #    the 2026-06-09 OTP tarpit); fall back to password login.
    $env:BW_SESSION = $null
    $status = (bw status 2>$null | ConvertFrom-Json).status
    if ($status -eq 'unauthenticated') {
        $apikeyFile = "$dir\bw-apikey.xml"
        if (Test-Path $apikeyFile) {
            $ak = Import-Clixml $apikeyFile
            $b1 = [Runtime.InteropServices.Marshal]::SecureStringToBSTR($ak.client_id)
            $env:BW_CLIENTID = [Runtime.InteropServices.Marshal]::PtrToStringBSTR($b1)
            [Runtime.InteropServices.Marshal]::ZeroFreeBSTR($b1)
            $b2 = [Runtime.InteropServices.Marshal]::SecureStringToBSTR($ak.client_secret)
            $env:BW_CLIENTSECRET = [Runtime.InteropServices.Marshal]::PtrToStringBSTR($b2)
            [Runtime.InteropServices.Marshal]::ZeroFreeBSTR($b2)
            bw login --apikey | Out-Null
            $loginRc = $LASTEXITCODE
            $env:BW_CLIENTID = $null
            $env:BW_CLIENTSECRET = $null
        } else {
            bw login alto84@gmail.com --passwordenv BW_PASSWORD --raw | Out-Null
            $loginRc = $LASTEXITCODE
        }
        if ($loginRc -ne 0) {
            Log "FAIL: bw login rc=$loginRc (device-verification OTP wall? seed an API key via bw-apikey-seed.ps1 — durable fix)"
            exit 4
        }
        Log "re-authenticated (was unauthenticated)"
    }

    # 4. Unlock and cache the session token.
    $session = bw unlock --passwordenv BW_PASSWORD --raw
    if ($LASTEXITCODE -ne 0 -or -not $session) { Log "FAIL: bw unlock rc=$LASTEXITCODE"; exit 3 }
    New-Item -ItemType Directory -Force $dir | Out-Null
    Set-Content -Path $sessionFile -Value $session -Encoding ascii -NoNewline
    $env:BW_SESSION = $session
    bw sync 2>$null | Out-Null
    Log "renewed (status was '$status' -> unlocked; vault synced)"
    exit 0
}
finally {
    $env:BW_PASSWORD = $null
}
