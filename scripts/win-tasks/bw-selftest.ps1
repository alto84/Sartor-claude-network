# bw-probe.ps1 — definitive, non-hanging test of whether the cached session can
# decrypt an item. Feeds empty stdin so bw fails fast instead of blocking on a
# hidden master-password prompt. Writes one PASS/FAIL line to a result file.
$dir = "$env:LOCALAPPDATA\Sartor"
$session = (Get-Content "$dir\bw-session" -Raw).Trim()
$res = "$dir\probe-result.txt"
Remove-Item $res -ErrorAction SilentlyContinue

$psi = New-Object System.Diagnostics.ProcessStartInfo
$psi.FileName = 'cmd.exe'
$psi.Arguments = "/c bw get item ""UniFi superadmin"" --session $session"
$psi.UseShellExecute = $false
$psi.RedirectStandardInput = $true
$psi.RedirectStandardOutput = $true
$psi.RedirectStandardError = $true
$p = [System.Diagnostics.Process]::Start($psi)
$p.StandardInput.Close()   # empty stdin -> bw can't block on a prompt
$stdout = $p.StandardOutput.ReadToEndAsync()
$stderr = $p.StandardError.ReadToEndAsync()
if ($p.WaitForExit(25000)) {
    $o = $stdout.Result; $e = $stderr.Result
    if ($o -match '"login"|"username"|"password"|"name"\s*:') { "PASS rc=$($p.ExitCode) (item decrypted)" | Set-Content $res }
    else { "FAIL rc=$($p.ExitCode) err=$(($e -replace '\s+',' ').Trim().Substring(0,[Math]::Min(120,($e).Length)))" | Set-Content $res }
} else {
    $p.Kill()
    "HANG (killed after 25s) -> session does not unlock operations" | Set-Content $res
}
Get-Content $res
