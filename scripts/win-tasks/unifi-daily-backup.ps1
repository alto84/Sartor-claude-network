# UniFi Network Application — daily backup script
# Runs via Windows Scheduled Task. Saves .unf to local backups + SCP to rtxserver
# (off-site copy on the LAN, away from Rocinante's drive).
# Local copies older than 30 days are pruned. rtxserver copies kept indefinitely.

$ErrorActionPreference = "Continue"
$timestamp = Get-Date -Format "yyyy-MM-dd_HHmm"
$logFile = "C:\Users\alto8\backups\unifi\backup-log.txt"
$localDir = "C:\Users\alto8\backups\unifi"
$rtxHost = "alton@192.168.1.157"
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

  $session = New-Object Microsoft.PowerShell.Commands.WebRequestSession
  $loginBody = @{username='alton'; password=';lkjpoiu0987'; remember=$false} | ConvertTo-Json

  Invoke-RestMethod -Uri "https://192.168.1.171:8443/api/login" `
    -Method POST -Body $loginBody -ContentType "application/json" `
    -WebSession $session | Out-Null
  Log "Login OK"

  $backupBody = @{cmd='backup'; days=0} | ConvertTo-Json
  $resp = Invoke-RestMethod -Uri "https://192.168.1.171:8443/api/s/default/cmd/backup" `
    -Method POST -Body $backupBody -ContentType "application/json" `
    -WebSession $session
  $url = "https://192.168.1.171:8443" + $resp.data[0].url
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
