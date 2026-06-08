<#
launch-cc-chrome.ps1 — launch the dedicated credentialed automation Chrome (CC-Chrome).

Per DESIGN-v2: NO --remote-debugging-port (extension-driven, so there is no open
unauthenticated CDP handle on the all-credentials profile). Headed (Sync + autofill need it).

After launch it discovers CC-Chrome's process IDs (the chrome.exe processes whose command
line contains the dedicated profile path — this is how we distinguish CC-Chrome from Alton's
PERSONAL Chrome, which shares the window class) and writes the allow-list that gate.ps1 reads.
gate.ps1 then permits OS-write ONLY when the foreground window belongs to a CC-Chrome PID
(plus the native file-dialog class). Alton's personal Chrome is never on the allow-list.

Usage:  launch-cc-chrome.ps1            # launch + write allow-list
        launch-cc-chrome.ps1 -AllowListOnly   # re-derive PIDs and rewrite allow-list (no launch)
#>
[CmdletBinding()]
param([switch]$AllowListOnly)

$Chrome      = 'C:\Program Files (x86)\Google\Chrome\Application\chrome.exe'
$ProfileDir  = 'C:\Users\alto8\chrome-computer-control-profile'
$RuntimeDir  = 'C:\Users\alto8\computer-control-runtime'
$AllowCfg    = Join-Path $RuntimeDir 'gate-allowlist.json'
if (-not (Test-Path $RuntimeDir)) { New-Item -ItemType Directory -Path $RuntimeDir -Force | Out-Null }

if (-not $AllowListOnly) {
  if (-not (Test-Path $Chrome)) { Write-Error "Chrome not found at $Chrome"; exit 1 }
  Start-Process -FilePath $Chrome -ArgumentList @(
    "--user-data-dir=$ProfileDir",
    '--no-first-run',
    '--no-default-browser-check',
    '--restore-last-session'
  ) | Out-Null
  Start-Sleep -Seconds 3   # let the browser process spawn
}

# Discover CC-Chrome PIDs by command line (the profile path is the discriminator).
$escaped = [regex]::Escape($ProfileDir)
$ccProcs = Get-CimInstance Win32_Process -Filter "Name='chrome.exe'" |
           Where-Object { $_.CommandLine -and ($_.CommandLine -match $escaped) }
$pids = @($ccProcs | Select-Object -ExpandProperty ProcessId)

if (-not $pids -or $pids.Count -eq 0) {
  Write-Warning "No CC-Chrome process found for profile $ProfileDir. Is it running? Allow-list not written."
  exit 2
}

# Write the allow-list gate.ps1 consumes. PID-based (robust against window recreation and
# distinguishes CC-Chrome from personal Chrome). #32770 = native Win32 dialog (file picker).
$cfg = [pscustomobject]@{
  generated      = (Get-Date).ToString('o')
  profileDir     = $ProfileDir
  pids           = $pids
  classPatterns  = @('^#32770$')           # native dialogs (open/save file picker)
  titlePatterns  = @()                      # none by default; PID is the trust anchor
  denyTitlePatterns = @('^SARTOR-CONFIRM-') # never act on the confirm dialog
}
$cfg | ConvertTo-Json -Depth 5 | Set-Content -Path $AllowCfg -Encoding UTF8
"CC-Chrome PIDs: $($pids -join ', ')"
"allow-list written: $AllowCfg"
