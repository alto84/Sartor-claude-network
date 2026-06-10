# gpuserver2-rotate-pw.ps1 — one-shot rotation of the gpuserver2 'alton' Linux
# password (C9 tail: the bringup temp password was shared in chat). Generates a
# strong value, sets it on the box via key-auth SSH + chpasswd, stores it in the
# vault as a login item. The value never prints, never lands in a file. Idempotent
# on the vault item (updates if it already exists). Access path is SSH key +
# passwordless sudo, so a bad rotation cannot lock anyone out.
$ErrorActionPreference = 'Stop'
$session = (Get-Content "$env:LOCALAPPDATA\Sartor\bw-session" -Raw).Trim()
$host2 = 'alton@192.168.1.175'
$itemName = 'gpuserver2 alton'

# 1. Strong random password (24 chars, URL-safe; no shell-hostile chars).
$alphabet = (48..57 + 65..90 + 97..122) | ForEach-Object { [char]$_ }
$alphabet += '-_.~'.ToCharArray()
$rng = [System.Security.Cryptography.RandomNumberGenerator]::Create()
$bytes = New-Object byte[] 24
$rng.GetBytes($bytes)
$pw = -join ($bytes | ForEach-Object { $alphabet[$_ % $alphabet.Length] })

# 2. Set on the box. Base64-encode "user:pass" (pure ASCII — avoids PowerShell's
#    UTF-8 BOM corrupting piped stdin) and decode remotely into sudo chpasswd.
$b64 = [Convert]::ToBase64String([Text.Encoding]::ASCII.GetBytes("alton:$pw"))
ssh -o ConnectTimeout=10 $host2 "echo $b64 | base64 -d | sudo chpasswd"
if ($LASTEXITCODE -ne 0) { Write-Output "FAIL: chpasswd rc=$LASTEXITCODE (password NOT changed)"; exit 1 }

# Feed an ASCII string to a bw subcommand's stdin via BaseStream (no UTF-8 BOM,
# which is what corrupted `| bw encode`). Returns @{rc; out}.
function Invoke-BwStdin([string]$bwArgs, [string]$stdinText) {
    $psi = New-Object System.Diagnostics.ProcessStartInfo
    $psi.FileName = 'cmd.exe'; $psi.Arguments = "/c bw $bwArgs --session $session"
    $psi.UseShellExecute = $false
    $psi.RedirectStandardInput = $true; $psi.RedirectStandardOutput = $true; $psi.RedirectStandardError = $true
    $p = [System.Diagnostics.Process]::Start($psi)
    $bytes = [Text.Encoding]::ASCII.GetBytes($stdinText)
    $p.StandardInput.BaseStream.Write($bytes, 0, $bytes.Length)
    $p.StandardInput.BaseStream.Flush(); $p.StandardInput.BaseStream.Close()
    $out = $p.StandardOutput.ReadToEnd(); $null = $p.StandardError.ReadToEnd()
    $p.WaitForExit(20000) | Out-Null
    return @{ rc = $p.ExitCode; out = $out }
}

# 3. Store/update in the vault. base64 the JSON ourselves (ASCII) instead of `bw encode`.
$existing = bw list items --search $itemName --session $session 2>$null | ConvertFrom-Json
$note = "gpuserver2 (192.168.1.175) Linux user password. Rotated 2026-06-09 (C9). Access is SSH key + passwordless sudo; this is the fallback console password."
if ($existing -and $existing.Count -ge 1) {
    $id = $existing[0].id
    $item = bw get item $id --session $session | ConvertFrom-Json
    $item.login.password = $pw
    $item.login.username = 'alton'
    $json = $item | ConvertTo-Json -Depth 10 -Compress
    $b64j = [Convert]::ToBase64String([Text.Encoding]::UTF8.GetBytes($json))
    $r = Invoke-BwStdin "edit item $id" $b64j
    $action = "updated existing vault item"
} else {
    $login = [PSCustomObject]@{ username = 'alton'; password = $pw }
    $item = [PSCustomObject]@{ type = 1; name = $itemName; login = $login; notes = $note }
    $json = $item | ConvertTo-Json -Depth 10 -Compress
    $b64j = [Convert]::ToBase64String([Text.Encoding]::UTF8.GetBytes($json))
    $r = Invoke-BwStdin "create item" $b64j
    $action = "created new vault item"
}
if ($r.rc -ne 0) { Write-Output "WARN: box password changed but vault store rc=$($r.rc). Re-run to retry (key auth unaffected)."; $pw=$null; exit 2 }
bw sync --session $session 2>$null | Out-Null

# 4. Verify the stored value matches before declaring success.
$check = bw list items --search $itemName --session $session 2>$null | ConvertFrom-Json
$stored = if ($check -and $check.Count -ge 1) { (bw get item $check[0].id --session $session | ConvertFrom-Json).login.password } else { '' }
$ok = ($stored -eq $pw)
$pw = $null; $json = $null; $b64j = $null
if ($ok) { Write-Output "SUCCESS: gpuserver2 'alton' password rotated and verified in vault ($action)." }
else { Write-Output "FAIL: box password changed but vault value does NOT match. Re-run (key auth unaffected)."; exit 3 }
