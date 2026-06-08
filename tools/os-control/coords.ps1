<#
coords.ps1 — single source of truth for screen geometry.
Pins PER_MONITOR_AWARE_V2 (-4) at process start so all reads are PHYSICAL pixels,
then emits the virtual-desktop bounds + per-monitor manifest as JSON.
Used by input.ps1 / capture.ps1 / gate.ps1 to normalize coordinates for SendInput
ABSOLUTE|VIRTUALDESK. No synthetic input here — read-only.

Usage:  powershell -NoProfile -ExecutionPolicy Bypass -File coords.ps1
Output: JSON { virtual:{x,y,w,h}, screens:[{name,primary,x,y,w,h}] }
#>
[CmdletBinding()]
param([switch]$Raw)

Add-Type -Namespace SartorCC -Name Dpi -MemberDefinition @'
[DllImport("user32.dll")] public static extern bool SetProcessDpiAwarenessContext(System.IntPtr value);
[DllImport("user32.dll")] public static extern int GetSystemMetrics(int nIndex);
'@ -ErrorAction SilentlyContinue

# DPI_AWARENESS_CONTEXT_PER_MONITOR_AWARE_V2 = (HANDLE)-4. Must run before geometry reads.
try { [void][SartorCC.Dpi]::SetProcessDpiAwarenessContext([System.IntPtr](-4)) } catch {}

# SM_*VIRTUALSCREEN indices
$SM_XVIRTUALSCREEN  = 76
$SM_YVIRTUALSCREEN  = 77
$SM_CXVIRTUALSCREEN = 78
$SM_CYVIRTUALSCREEN = 79

$vx = [SartorCC.Dpi]::GetSystemMetrics($SM_XVIRTUALSCREEN)
$vy = [SartorCC.Dpi]::GetSystemMetrics($SM_YVIRTUALSCREEN)
$vw = [SartorCC.Dpi]::GetSystemMetrics($SM_CXVIRTUALSCREEN)
$vh = [SartorCC.Dpi]::GetSystemMetrics($SM_CYVIRTUALSCREEN)

Add-Type -AssemblyName System.Windows.Forms -ErrorAction SilentlyContinue
$screens = @()
foreach ($s in [System.Windows.Forms.Screen]::AllScreens) {
  $b = $s.Bounds
  $screens += [pscustomobject]@{
    name    = $s.DeviceName
    primary = $s.Primary
    x       = $b.X
    y       = $b.Y
    w       = $b.Width
    h       = $b.Height
  }
}

$manifest = [pscustomobject]@{
  virtual = [pscustomobject]@{ x = $vx; y = $vy; w = $vw; h = $vh }
  screens = $screens
}

if ($Raw) { return $manifest }
$manifest | ConvertTo-Json -Depth 5 -Compress
