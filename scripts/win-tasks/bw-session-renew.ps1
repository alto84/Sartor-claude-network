# bw-session-renew.ps1 - keep the Bitwarden CLI session alive for Sartor automation.
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

# 1. If the cached session can still DECRYPT, we're done. (bw status is
#    unreliable here — it reports "locked" for working sessions — so probe an
#    actual read with empty stdin so a dead session fails fast, never prompts.)
if (Test-Path $sessionFile) {
    $cached = (Get-Content $sessionFile -Raw).Trim()
    if ($cached) {
        $psi = New-Object System.Diagnostics.ProcessStartInfo
        $psi.FileName = 'cmd.exe'
        $psi.Arguments = "/c bw list items --session $cached"
        $psi.UseShellExecute = $false
        $psi.RedirectStandardInput = $true
        $psi.RedirectStandardOutput = $true
        $psi.RedirectStandardError = $true
        $pp = [System.Diagnostics.Process]::Start($psi)
        $pp.StandardInput.Close()
        $oo = $pp.StandardOutput.ReadToEndAsync()
        if ($pp.WaitForExit(15000)) {
            if ($pp.ExitCode -eq 0 -and $oo.Result -match '"id"\s*:') { Log "ok (cached session decrypts)"; exit 0 }
        } else { $pp.Kill() }
    }
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
    #    (bw login --apikey skips new-device email verification entirely -
    #    the 2026-06-09 OTP tarpit); fall back to password login.
    # Login strategy (2026-06-09, hard-won): PASSWORD login produces a session
    # that can decrypt the vault; APIKEY login + unlock hits an upstream CLI bug
    # ("bitwarden_crypto: decryption operation failed"). But password login on an
    # UNTRUSTED device demands an email OTP (the throttled tarpit). The apikey
    # login's only job here is to establish device trust without OTP; once the
    # device is trusted, password login works OTP-free forever. So: try password
    # login; if it's blocked by device verification, use the apikey to register
    # the device, log back out, and retry password login.
    # bw login --raw returns a session that is BOTH authenticated AND unlocked
    # and (critically) can decrypt the vault. A SEPARATE `bw unlock` call yields
    # a session that hits the crypto-decrypt bug in this CLI version, so we never
    # use bw unlock — the login session IS the session. Returns the token or ''.
    $script:loginSession = ''
    function Invoke-PasswordLogin {
        $out = bw login alto84@gmail.com --passwordenv BW_PASSWORD --raw 2>$null
        $rc = $LASTEXITCODE
        if ($rc -eq 0) { $script:loginSession = ($out | Out-String).Trim() }
        return $rc
    }
    function Invoke-ApikeyTrust {
        $apikeyFile = "$dir\bw-apikey.xml"
        if (-not (Test-Path $apikeyFile)) { return $false }
        $ak = Import-Clixml $apikeyFile
        $b1 = [Runtime.InteropServices.Marshal]::SecureStringToBSTR($ak.client_id)
        $env:BW_CLIENTID = [Runtime.InteropServices.Marshal]::PtrToStringBSTR($b1)
        [Runtime.InteropServices.Marshal]::ZeroFreeBSTR($b1)
        $b2 = [Runtime.InteropServices.Marshal]::SecureStringToBSTR($ak.client_secret)
        $env:BW_CLIENTSECRET = [Runtime.InteropServices.Marshal]::PtrToStringBSTR($b2)
        [Runtime.InteropServices.Marshal]::ZeroFreeBSTR($b2)
        bw login --apikey 2>$null | Out-Null
        $rc = $LASTEXITCODE
        $env:BW_CLIENTID = $null; $env:BW_CLIENTSECRET = $null
        if ($rc -eq 0) { bw logout 2>$null | Out-Null }  # drop apikey auth; keep device trust
        return ($rc -eq 0)
    }

    # Force a clean state so we always obtain a session from `bw login --raw`
    # (the only kind that decrypts). Logout is a no-op if already logged out.
    $env:BW_SESSION = $null
    bw logout 2>$null | Out-Null

    $loginRc = Invoke-PasswordLogin
    if ($loginRc -ne 0) {
        Log "password login blocked (likely untrusted device); trying apikey to register trust"
        if (Invoke-ApikeyTrust) { $loginRc = Invoke-PasswordLogin }
    }
    if ($loginRc -ne 0 -or -not $script:loginSession) {
        Log "FAIL: bw login rc=$loginRc (device not trusted and apikey-trust path failed; seed bw-apikey-seed.ps1)"
        exit 4
    }

    # Cache the login session (it is already unlocked and can decrypt).
    New-Item -ItemType Directory -Force $dir | Out-Null
    Set-Content -Path $sessionFile -Value $script:loginSession -Encoding ascii -NoNewline
    bw sync --session $script:loginSession 2>$null | Out-Null
    Log "renewed via password login (working decrypt session cached)"
    exit 0
}
finally {
    $env:BW_PASSWORD = $null
}
