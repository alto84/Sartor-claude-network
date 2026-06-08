<#
capture.ps1 — screenshot for the agent's perception loop, with CODE-ENFORCED credential
safety (the agent's judgment is not trusted to keep secrets out of frames).

Guarantees (not optional, not the agent's choice):
  * REFUSES to capture if the foreground window is the SARTOR-CONFIRM dialog
    (so the agent can never screenshot the approval nonce).
  * REFUSES to capture while the runtime CREDENTIAL-ACTIVE flag is set, UNLESS -MaskRectsJson
    is supplied; the password-flow sets that flag around fills, so an un-masked frame
    cannot be produced during credential entry.
  * Masks (black-boxes) every rectangle in -MaskRectsJson before the PNG is written.
  * PATH-LOCKS output into the runtime dir (outside the repo/mirror tree); a caller cannot
    redirect a capture into a git-tracked / mirrored path.

Pins PER_MONITOR_AWARE_V2 so coordinates match input.ps1.

Usage:
  capture.ps1 -Monitor primary -Out shot.png
  capture.ps1 -Monitor all -Out desktop.png
  capture.ps1 -Region 100,200,800,600 -Out region.png
  capture.ps1 -Monitor primary -Out login.png -MaskRectsJson '[{"x":420,"y":300,"w":260,"h":34}]'
#>
[CmdletBinding()]
param(
  [ValidateSet('all','primary','0','1','2','3')][string]$Monitor='primary',
  [int[]]$Region,                 # x,y,w,h (screen/virtual coords) — overrides -Monitor
  [string]$MaskRectsJson,         # JSON array of {x,y,w,h} in screen coords to black out
  [Parameter(Mandatory)][string]$Out,   # FILENAME only; forced into the runtime dir
  [switch]$Cursor
)

$ErrorActionPreference = 'Stop'
$RuntimeDir = 'C:\Users\alto8\computer-control-runtime'
$CredFlag   = Join-Path $RuntimeDir 'CREDENTIAL-ACTIVE'
$CapDir     = Join-Path $RuntimeDir 'captures'
if (-not (Test-Path $CapDir)) { New-Item -ItemType Directory -Path $CapDir -Force | Out-Null }

# DPI awareness + foreground probe
if (-not ('SartorCC.Cap' -as [type])) {
Add-Type -Namespace SartorCC -Name Cap -MemberDefinition @'
[DllImport("user32.dll")] public static extern bool SetProcessDpiAwarenessContext(IntPtr value);
[DllImport("user32.dll")] public static extern int GetSystemMetrics(int nIndex);
[DllImport("user32.dll")] public static extern IntPtr GetForegroundWindow();
[DllImport("user32.dll")] public static extern int GetWindowText(IntPtr h, System.Text.StringBuilder s, int n);
'@
}
try { [void][SartorCC.Cap]::SetProcessDpiAwarenessContext([System.IntPtr](-4)) } catch {}

# --- credential-safety refusals (code-enforced) ---
$fgh = [SartorCC.Cap]::GetForegroundWindow()
$sb = New-Object System.Text.StringBuilder 512; [void][SartorCC.Cap]::GetWindowText($fgh,$sb,512)
if ($sb.ToString() -like 'SARTOR-CONFIRM-*') { Write-Error 'capture REFUSED: foreground is the confirm dialog'; exit 4 }
if ((Test-Path $CredFlag) -and -not $MaskRectsJson) { Write-Error 'capture REFUSED: CREDENTIAL-ACTIVE set and no mask rects supplied'; exit 4 }

# --- path-lock output into the runtime captures dir ---
$leaf = Split-Path $Out -Leaf
if (-not $leaf) { $leaf = 'capture.png' }
if ($leaf -notmatch '\.png$') { $leaf = "$leaf.png" }
$dest = Join-Path $CapDir $leaf

Add-Type -AssemblyName System.Windows.Forms
Add-Type -AssemblyName System.Drawing

# --- resolve capture rectangle ---
if ($Region -and $Region.Count -eq 4) {
  $rx=$Region[0]; $ry=$Region[1]; $rw=$Region[2]; $rh=$Region[3]
} elseif ($Monitor -eq 'all') {
  $vs = [System.Windows.Forms.SystemInformation]::VirtualScreen
  $rx=$vs.X; $ry=$vs.Y; $rw=$vs.Width; $rh=$vs.Height
} else {
  $screens = [System.Windows.Forms.Screen]::AllScreens
  $target = $null
  if ($Monitor -eq 'primary') { $target = ($screens | Where-Object { $_.Primary } | Select-Object -First 1) }
  else { $idx=[int]$Monitor; if ($idx -lt $screens.Count) { $target = $screens[$idx] } }
  if (-not $target) { $target = ($screens | Where-Object { $_.Primary } | Select-Object -First 1) }
  $b = $target.Bounds; $rx=$b.X; $ry=$b.Y; $rw=$b.Width; $rh=$b.Height
}

$bmp = New-Object System.Drawing.Bitmap $rw, $rh
$g = [System.Drawing.Graphics]::FromImage($bmp)
$g.CopyFromScreen($rx, $ry, 0, 0, (New-Object System.Drawing.Size($rw,$rh)))

# --- mask credential rectangles (screen coords -> bitmap coords) ---
if ($MaskRectsJson) {
  $rects = $MaskRectsJson | ConvertFrom-Json
  $black = New-Object System.Drawing.SolidBrush ([System.Drawing.Color]::Black)
  foreach ($r in @($rects)) {
    $mx = [int]$r.x - $rx; $my = [int]$r.y - $ry
    $g.FillRectangle($black, $mx, $my, [int]$r.w, [int]$r.h)
  }
  $black.Dispose()
}

if ($Cursor) {
  try {
    $cp = [System.Windows.Forms.Cursor]::Position
    $pen = New-Object System.Drawing.Pen ([System.Drawing.Color]::Red), 2
    $cx = $cp.X - $rx; $cy = $cp.Y - $ry
    $g.DrawLine($pen, $cx-10, $cy, $cx+10, $cy); $g.DrawLine($pen, $cx, $cy-10, $cx, $cy+10)
    $pen.Dispose()
  } catch {}
}

$g.Dispose()
$bmp.Save($dest, [System.Drawing.Imaging.ImageFormat]::Png)
$bmp.Dispose()
$dest
