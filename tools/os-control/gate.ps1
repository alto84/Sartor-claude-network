<#
gate.ps1 — the MANDATORY safety wrapper. EVERY synthetic OS action goes through here;
nothing calls input.ps1 directly. Order of enforcement (fail-closed):

  1. Kill switch  — STOP flag in the runtime dir aborts immediately.
  2. Allow-list   — the target/foreground window MUST match the allow-list, else REFUSE.
                    (No allow-list config present => only -DryRun is permitted. Fail closed.)
  3. Confirm gate — irreversible classes (money / send-as-principal / export-logins)
                    require out-of-band human approval via confirm.ps1.
  4. Re-verify    — foreground window re-checked immediately before SendInput (focus-steal).
  5. Act          — dot-source input.ps1 and perform; metadata-only audit append.

Credential entry: pass -LoginName '<bitwarden-name>' (NEVER a value). gate resolves it to
a SecureString inside this scope via fetch-login.ps1, types per-char via Invoke-CCTypeSecure,
and zeroes it. The value is never a parameter, never logged, never returned.

Usage examples:
  gate.ps1 -Action click -X 1200 -Y 640 -Intent "click Compose" -ExpectHwnd 0x00A1
  gate.ps1 -Action type  -Text "hello"  -Intent "search box"
  gate.ps1 -Action click -X 800 -Y 500 -Intent "confirm wire" -ActionClass money -TargetHost chase.com
  gate.ps1 -Action type  -LoginName "vastai-login" -Intent "password field"
#>
[CmdletBinding(SupportsShouldProcess=$true)]
param(
  [Parameter(Mandatory)][ValidateSet('move','click','drag','wheel','type','key','chord')][string]$Action,
  [int]$X,[int]$Y,[int]$X2,[int]$Y2,
  [ValidateSet('left','right','middle')][string]$Button='left',
  [switch]$Double,[int]$Notches,
  [string]$Text,[int]$Vk,[int[]]$Mods,
  [string]$LoginName,
  [Parameter(Mandatory)][string]$Intent,
  [ValidateSet('none','money','send-as-principal','export-logins')][string]$ActionClass='none',
  [string]$TargetHost='',
  [string]$ExpectHwnd='',
  [switch]$DryRun
)

$ErrorActionPreference = 'Stop'
$RuntimeDir   = 'C:\Users\alto8\computer-control-runtime'
$StopFlag     = Join-Path $RuntimeDir 'STOP'
$AuditLog     = Join-Path $RuntimeDir 'audit.log'
$AllowListCfg = Join-Path $RuntimeDir 'gate-allowlist.json'
if (-not (Test-Path $RuntimeDir)) { New-Item -ItemType Directory -Path $RuntimeDir -Force | Out-Null }

if (-not ('SartorCC.Win' -as [type])) {
Add-Type -Namespace SartorCC -Name Win -MemberDefinition @'
[DllImport("user32.dll")] public static extern IntPtr GetForegroundWindow();
[DllImport("user32.dll")] public static extern int GetWindowText(IntPtr h, System.Text.StringBuilder s, int n);
[DllImport("user32.dll")] public static extern int GetClassName(IntPtr h, System.Text.StringBuilder s, int n);
'@
}
function Get-CCForeground {
  $h = [SartorCC.Win]::GetForegroundWindow()
  $t = New-Object System.Text.StringBuilder 512; [void][SartorCC.Win]::GetWindowText($h,$t,512)
  $c = New-Object System.Text.StringBuilder 256; [void][SartorCC.Win]::GetClassName($h,$c,256)
  [pscustomobject]@{ Hwnd = ('0x{0:X}' -f [int64]$h); Title = $t.ToString(); Class = $c.ToString() }
}

function Write-Audit($decision,$fg) {
  $rec = [pscustomobject]@{
    ts=(Get-Date).ToString('o'); action=$Action; class=$ActionClass; intent=$Intent
    decision=$decision; fg_title=$fg.Title; fg_class=$fg.Class; fg_hwnd=$fg.Hwnd
    x=$X; y=$Y; x2=$X2; y2=$Y2; expect=$ExpectHwnd; dryrun=[bool]$DryRun; targethost=$TargetHost
  }
  Add-Content -Path $AuditLog -Value ($rec | ConvertTo-Json -Compress)
}
function Deny($why,$fg){ Write-Audit "DENY:$why" $fg; Write-Error "gate DENY: $why"; exit 3 }

$fg = Get-CCForeground

# 1. Kill switch
if (Test-Path $StopFlag) { Deny 'kill-switch-STOP-present' $fg }

# 2. Allow-list (fail closed). The confirm dialog is always excluded.
if ($fg.Title -like 'SARTOR-CONFIRM-*') { Deny 'target-is-confirm-dialog' $fg }
$allowed = $false
if (Test-Path $AllowListCfg) {
  $cfg = Get-Content $AllowListCfg -Raw | ConvertFrom-Json
  foreach ($p in @($cfg.titlePatterns))   { if ($p -and $fg.Title -match $p) { $allowed = $true } }
  foreach ($p in @($cfg.classPatterns))   { if ($p -and $fg.Class -match $p) { $allowed = $true } }
  foreach ($hw in @($cfg.hwnds))          { if ($hw -and $fg.Hwnd -eq $hw)   { $allowed = $true } }
  foreach ($d in @($cfg.denyTitlePatterns)){ if ($d -and $fg.Title -match $d) { $allowed = $false } }
} else {
  if (-not $DryRun) { Deny 'no-allowlist-config-live-action-refused' $fg }
}
if ($ExpectHwnd -and $fg.Hwnd -ne $ExpectHwnd) { Deny "foreground-hwnd-mismatch(expected $ExpectHwnd got $($fg.Hwnd))" $fg }
if (-not $allowed -and -not $DryRun) { Deny 'foreground-not-on-allowlist' $fg }

# 3. Confirm gate (irreversible classes)
if ($ActionClass -ne 'none') {
  $confirm = Join-Path $PSScriptRoot 'confirm.ps1'
  $p = Start-Process -FilePath 'powershell.exe' -PassThru -Wait -WindowStyle Normal -ArgumentList @(
    '-NoProfile','-ExecutionPolicy','Bypass','-File',$confirm,
    '-ActionClass',$ActionClass,'-Intent',$Intent,'-Target',$fg.Title,'-TargetHost',$TargetHost,'-TimeoutSec','60')
  if ($p.ExitCode -ne 0) { Deny "out-of-band-confirm-denied(class=$ActionClass)" $fg }
}

# 4. Re-verify foreground unchanged since the decision
$fg2 = Get-CCForeground
if ($fg2.Hwnd -ne $fg.Hwnd) { Deny "foreground-changed-before-act($($fg.Hwnd)->$($fg2.Hwnd))" $fg2 }

# Dry-run stops here (logs intent, sends nothing)
if ($DryRun -or $WhatIfPreference) { Write-Audit 'WHATIF-OK' $fg; "WHATIF $Action '$Intent' fg=$($fg.Title)"; exit 0 }

# 5. Act
. (Join-Path $PSScriptRoot 'input.ps1')
switch ($Action) {
  'move'  { Invoke-CCMove  -X $X -Y $Y }
  'click' { if ($Double) { Invoke-CCClick -X $X -Y $Y -Button $Button -Double } else { Invoke-CCClick -X $X -Y $Y -Button $Button } }
  'drag'  { Invoke-CCDrag  -X1 $X -Y1 $Y -X2 $X2 -Y2 $Y2 -Button $Button }
  'wheel' { Invoke-CCWheel -Notches $Notches }
  'key'   { Invoke-CCKey   -Vk $Vk }
  'chord' { Invoke-CCChord -Mods $Mods -Vk $Vk }
  'type'  {
    if ($LoginName) {
      $ss = & (Join-Path $PSScriptRoot 'fetch-login.ps1') -Name $LoginName   # returns SecureString
      if (-not $ss) { Deny "login-not-available($LoginName)" $fg }
      Invoke-CCTypeSecure -Secure $ss
      $ss.Dispose()
    } else {
      Invoke-CCType -Text $Text
    }
  }
}
Write-Audit 'ACT-OK' $fg
"OK $Action '$Intent'"
exit 0
