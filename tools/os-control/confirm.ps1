<#
confirm.ps1 — OUT-OF-BAND human approval for catastrophic-tier actions
(move money / send-as-Alton / export saved logins). The keystone control.

Why the agent cannot self-satisfy this:
  * The dialog's window title is "SARTOR-CONFIRM-<nonce>" and is hard-EXCLUDED from
    gate.ps1's allow-list, so the gate refuses any synthetic input targeting it.
  * capture.ps1 refuses to screenshot any window whose title starts "SARTOR-CONFIRM-",
    so the agent cannot read the nonce to type it elsewhere.
  * Approval requires a PHYSICAL human keypress/click in a TOPMOST window.

Exit codes:  0 = approved (human clicked Approve)   2 = denied / timeout / closed.

Usage:
  powershell -NoProfile -ExecutionPolicy Bypass -File confirm.ps1 `
     -ActionClass money -Intent "Transfer $5,000" -Target "Chase - Transfer" -Host "chase.com" -TimeoutSec 60
#>
[CmdletBinding()]
param(
  [Parameter(Mandatory)][ValidateSet('money','send-as-principal','export-secrets','other')][string]$ActionClass,
  [Parameter(Mandatory)][string]$Intent,
  [string]$Target = '(unspecified window)',
  [string]$TargetHost = '',
  [int]$TimeoutSec = 60
)

$nonce = -join ((48..57)+(65..90) | Get-Random -Count 6 | ForEach-Object {[char]$_})
$title = "SARTOR-CONFIRM-$nonce"

Add-Type -AssemblyName System.Windows.Forms
Add-Type -AssemblyName System.Drawing
[System.Windows.Forms.Application]::EnableVisualStyles()

$form              = New-Object System.Windows.Forms.Form
$form.Text         = $title
$form.Width        = 560
$form.Height       = 320
$form.StartPosition= 'CenterScreen'
$form.TopMost      = $true
$form.FormBorderStyle = 'FixedDialog'
$form.MaximizeBox  = $false
$form.MinimizeBox  = $false
$form.BackColor    = [System.Drawing.Color]::FromArgb(28,28,30)

$header = New-Object System.Windows.Forms.Label
$header.Text = "CONFIRM: $ActionClass"
$header.ForeColor = [System.Drawing.Color]::FromArgb(255,99,99)
$header.Font = New-Object System.Drawing.Font('Segoe UI',14,[System.Drawing.FontStyle]::Bold)
$header.SetBounds(20,16,520,30)

$body = New-Object System.Windows.Forms.Label
$bodyText = "The agent is requesting an irreversible action.`r`n`r`nAction: $Intent`r`nTarget: $Target"
if ($TargetHost) { $bodyText += "`r`nHost:   $TargetHost" }
$bodyText += "`r`n`r`nApprove ONLY if you intended this. Code $nonce."
$body.Text = $bodyText
$body.ForeColor = [System.Drawing.Color]::White
$body.Font = New-Object System.Drawing.Font('Segoe UI',10)
$body.SetBounds(20,54,520,150)

$timerLbl = New-Object System.Windows.Forms.Label
$timerLbl.ForeColor = [System.Drawing.Color]::Gray
$timerLbl.Font = New-Object System.Drawing.Font('Segoe UI',9)
$timerLbl.SetBounds(20,210,520,20)

$approve = New-Object System.Windows.Forms.Button
$approve.Text = '&Approve'
$approve.SetBounds(300,242,110,36)
$approve.DialogResult = [System.Windows.Forms.DialogResult]::OK
$approve.BackColor = [System.Drawing.Color]::FromArgb(60,60,64)
$approve.ForeColor = [System.Drawing.Color]::White

$deny = New-Object System.Windows.Forms.Button
$deny.Text = '&Deny'
$deny.SetBounds(420,242,110,36)
$deny.DialogResult = [System.Windows.Forms.DialogResult]::Cancel
$deny.BackColor = [System.Drawing.Color]::FromArgb(60,60,64)
$deny.ForeColor = [System.Drawing.Color]::White

$form.Controls.AddRange(@($header,$body,$timerLbl,$approve,$deny))
$form.AcceptButton = $approve
$form.CancelButton = $deny

$script:remaining = $TimeoutSec
$timer = New-Object System.Windows.Forms.Timer
$timer.Interval = 1000
$timer.Add_Tick({
  $script:remaining--
  $timerLbl.Text = "Auto-DENY in $script:remaining s"
  if ($script:remaining -le 0) { $timer.Stop(); $form.DialogResult = [System.Windows.Forms.DialogResult]::Cancel; $form.Close() }
})
$timerLbl.Text = "Auto-DENY in $script:remaining s"

$form.Add_Shown({ $form.Activate(); $form.BringToFront(); [System.Console]::Beep(880,200); $timer.Start() })
$result = $form.ShowDialog()
$timer.Stop(); $timer.Dispose(); $form.Dispose()

if ($result -eq [System.Windows.Forms.DialogResult]::OK) { exit 0 } else { exit 2 }
