# UniFi Network Application — daily backup script
# Runs via Windows Scheduled Task. Saves .unf to local backups + SCP to rtxserver
# (off-site copy on the LAN, away from Rocinante's drive).
# Local copies older than 30 days are pruned. rtxserver copies kept indefinitely.

$ErrorActionPreference = "Continue"
$timestamp = Get-Date -Format "yyyy-MM-dd_HHmm"
$logFile = "C:\Users\alto8\backups\unifi\backup-log.txt"
$localDir = "C:\Users\alto8\backups\unifi"
# Peer address resolves via ~/.ssh/config. UniFi controller is on Rocinante itself,
# so localhost is the future-proof URL — cert is self-signed and we already disable
# validation below via TrustAllCertsPolicy, so the cert's IP binding doesn't matter.
# (Was hardcoded 192.168.1.171 prior to 2026-05-19 fuseblow Rocinante DHCP shift.)
$rtxHost = "rtxserver"
$unifiBase = "https://127.0.0.1:8443"
$rtxDir = "/home/alton/sartor-network-backups"

function Log($msg) {
  $line = "$(Get-Date -Format 'yyyy-MM-dd HH:mm:ss') $msg"
  Add-Content -Path $logFile -Value $line
  Write-Host $line
}

# Ensure local dir exists
New-Item -ItemType Directory -Force -Path $localDir | Out-Null

Log "=== UniFi backup run started ==="

try {
  # Trust self-signed cert
  Add-Type @"
    using System.Net;
    using System.Security.Cryptography.X509Certificates;
    public class TrustAllCertsPolicy : ICertificatePolicy {
      public bool CheckValidationResult(ServicePoint srvPoint, X509Certificate certificate, WebRequest request, int certificateProblem) {
        return true;
      }
    }
"@ -ErrorAction SilentlyContinue
  [System.Net.ServicePointManager]::CertificatePolicy = New-Object TrustAllCertsPolicy
  [System.Net.ServicePointManager]::SecurityProtocol = [System.Net.SecurityProtocolType]::Tls12

  # Pull controller superadmin password from Bitwarden vault via sartor-secret wrapper.
  # Old hardcoded password was rotated 2026-05-04; the vault is the source of truth.
  $unifiPwd = & "C:\Users\alto8\Sartor-claude-network\scripts\sartor-secret.cmd" read 'UniFi superadmin' 2>&1
  if ($LASTEXITCODE -ne 0 -or [string]::IsNullOrWhiteSpace($unifiPwd)) {
    throw "sartor-secret read 'UniFi superadmin' failed (exit $LASTEXITCODE): $unifiPwd"
  }
  $unifiPwd = $unifiPwd.Trim()

  $session = New-Object Microsoft.PowerShell.Commands.WebRequestSession
  $loginBody = @{username='alton'; password=$unifiPwd; remember=$false} | ConvertTo-Json

  Invoke-RestMethod -Uri "https://127.0.0.1:8443/api/login" `
    -Method POST -Body $loginBody -ContentType "application/json" `
    -WebSession $session | Out-Null
  Remove-Variable unifiPwd, loginBody -ErrorAction SilentlyContinue
  Log "Login OK"

  # Read the download URL from the trigger response so this stays correct across
  # controller upgrades (the path is version-specific, e.g. /dl/backup/10.3.55.unf today).
  $backupBody = @{cmd='backup'; days=0} | ConvertTo-Json
  $resp = Invoke-RestMethod -Uri "https://127.0.0.1:8443/api/s/default/cmd/backup" `
    -Method POST -Body $backupBody -ContentType "application/json" `
    -WebSession $session
  $url = "https://127.0.0.1:8443" + $resp.data[0].url
  Log "Backup triggered, URL = $url"

  $localPath = Join-Path $localDir "sartor-claude-network_auto_$timestamp.unf"
  Invoke-WebRequest -Uri $url -OutFile $localPath -WebSession $session | Out-Null
  $sizeKB = [math]::Round((Get-Item $localPath).Length / 1KB, 1)
  Log "Local backup written: $localPath ($sizeKB KB)"

  # Off-site copy: SCP to rtxserver (on the LAN, 999GB free)
  $scpDest = "${rtxHost}:${rtxDir}/sartor-claude-network_auto_${timestamp}.unf"
  $scpResult = & scp -o ConnectTimeout=8 -o StrictHostKeyChecking=accept-new -o BatchMode=yes $localPath $scpDest 2>&1
  if ($LASTEXITCODE -eq 0) {
    Log "Off-site copy to rtxserver OK: $scpDest"
  } else {
    Log "WARN: SCP to rtxserver failed (exit $LASTEXITCODE): $scpResult"
    Log "  Local copy still saved at $localPath"
  }

  # Prune local copies older than 30 days (rtxserver copies kept indefinitely)
  $cutoff = (Get-Date).AddDays(-30)
  $pruned = Get-ChildItem -Path $localDir -Filter "sartor-claude-network_auto_*.unf" |
    Where-Object { $_.LastWriteTime -lt $cutoff }
  foreach ($f in $pruned) {
    Remove-Item $f.FullName
    Log "Pruned old: $($f.Name)"
  }

  Log "=== Run complete: SUCCESS ==="
  exit 0
} catch {
  Log "ERROR: $($_.Exception.Message)"
  Log "=== Run complete: FAILED ==="
  exit 1
}
