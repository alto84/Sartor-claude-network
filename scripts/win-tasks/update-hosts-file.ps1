# Update C:\Windows\System32\drivers\etc\hosts with Sartor LAN hostnames.
# Idempotent: managed block is delimited by "# === SARTOR LAN ===" / "# === END SARTOR LAN ==="
# so re-running cleanly replaces the block without duplicating entries.
#
# Source of truth: sartor/memory/machines/REGISTRY.yaml. This script does NOT
# import REGISTRY.yaml directly (no PowerShell YAML parser without modules);
# update the hash below in lockstep when an IP changes there.
#
# Designed to be run via Windows Scheduled Task with RunLevel=Highest
# (registered separately by register-update-hosts-file-task.ps1).

$ErrorActionPreference = 'Stop'
$hostsPath = 'C:\Windows\System32\drivers\etc\hosts'
$logPath   = 'C:\Users\alto8\backups\update-hosts-file.log'
$beginTag  = '# === SARTOR LAN ==='
$endTag    = '# === END SARTOR LAN ==='

$entries = [ordered]@{
    'gpuserver1'          = '192.168.1.199'
    'rtxserver'           = '192.168.1.157'
    'rtxpro6000server'    = '192.168.1.157'
    'rtxserver-bmc'       = '192.168.1.154'
    'rtxserver-bmc2'      = '192.168.1.156'
    'rocinante'           = '192.168.1.171'
    'unifi-controller'    = '192.168.1.171'
    'verizon-fios'        = '192.168.1.1'
}

function Write-Log($msg) {
    "$((Get-Date).ToString('yyyy-MM-dd HH:mm:ss')) $msg" | Add-Content -Path $logPath
}

if (-not (Test-Path $hostsPath)) {
    Write-Log "ERROR: hosts file missing at $hostsPath"
    exit 1
}

# Read existing content, strip any prior managed block
$content = Get-Content $hostsPath -Raw
$pattern = [regex]::Escape($beginTag) + '.*?' + [regex]::Escape($endTag) + '\r?\n?'
$stripped = [regex]::Replace($content, $pattern, '', [System.Text.RegularExpressions.RegexOptions]::Singleline)
$stripped = $stripped.TrimEnd("`r","`n")

# Build managed block
$block = @($beginTag)
$block += "# Managed by scripts/win-tasks/update-hosts-file.ps1"
$block += "# Generated: $((Get-Date).ToString('yyyy-MM-dd HH:mm:ss'))"
foreach ($name in $entries.Keys) {
    $ip = $entries[$name]
    $block += ("{0,-18} {1}" -f $ip, $name)
}
$block += $endTag

$newContent = $stripped + "`r`n`r`n" + ($block -join "`r`n") + "`r`n"

# Write
[System.IO.File]::WriteAllText($hostsPath, $newContent, [System.Text.Encoding]::UTF8)
Write-Log "OK wrote $($entries.Count) hostname entries"

# Flush DNS resolver cache so changes take effect immediately
& ipconfig /flushdns | Out-Null
Write-Log "OK flushed DNS resolver cache"

# Display result for caller
Write-Output "--- managed block now in hosts file ---"
$block | ForEach-Object { Write-Output $_ }
