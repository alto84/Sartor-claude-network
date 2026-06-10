# bw-login-otp.ps1 — authenticate the Bitwarden CLI through new-device email
# verification. Starts `bw login` with stdin held open, waits for the OTP to
# appear at %LOCALAPPDATA%\Sartor\bw-otp.txt (the agent fetches the emailed
# code and writes that file), feeds it, then runs the session renewal.
# Used when the CLI data dir is fresh (post-corruption) and Bitwarden demands
# device verification. Master password comes from the DPAPI store; no secret
# touches argv, stdout, or the log.

$dir = "$env:LOCALAPPDATA\Sartor"
$otp = "$dir\bw-otp.txt"
Remove-Item $otp -Force -ErrorAction SilentlyContinue

$sec = Import-Clixml "$dir\bw-master.xml"
$b = [Runtime.InteropServices.Marshal]::SecureStringToBSTR($sec)
$pw = [Runtime.InteropServices.Marshal]::PtrToStringBSTR($b)
[Runtime.InteropServices.Marshal]::ZeroFreeBSTR($b)

$psi = New-Object System.Diagnostics.ProcessStartInfo
$psi.FileName = 'cmd.exe'
$psi.Arguments = '/c bw login alto84@gmail.com --passwordenv BW_PASSWORD'
$psi.UseShellExecute = $false
$psi.RedirectStandardInput = $true
$psi.EnvironmentVariables['BW_PASSWORD'] = $pw
$pw = $null
$p = [System.Diagnostics.Process]::Start($psi)

Write-Output 'bw login started; waiting for OTP file (max 5 min)...'
$n = 0
while (-not (Test-Path $otp) -and $n -lt 150 -and -not $p.HasExited) { Start-Sleep -Seconds 2; $n++ }
if ((Test-Path $otp) -and -not $p.HasExited) {
    $code = (Get-Content $otp -Raw) -replace '[^\d]', ''
    # Raw ASCII bytes via BaseStream — the StreamWriter wrapper emits a UTF-8
    # BOM on first write under chcp 65001, which bw reads as part of the code
    # (the "invalid otp" failures of 2026-06-09 were exactly that).
    $bytes = [Text.Encoding]::ASCII.GetBytes("$code`r`n")
    $p.StandardInput.BaseStream.Write($bytes, 0, $bytes.Length)
    $p.StandardInput.BaseStream.Flush()
    $p.StandardInput.BaseStream.Close()
    Write-Output 'OTP fed (raw ASCII).'
}
$null = $p.WaitForExit(60000)
Remove-Item $otp -Force -ErrorAction SilentlyContinue
Write-Output "login rc=$($p.ExitCode)"
if ($p.ExitCode -eq 0) {
    & "$PSScriptRoot\bw-session-renew.ps1"
    Write-Output "renew rc=$LASTEXITCODE"
}
