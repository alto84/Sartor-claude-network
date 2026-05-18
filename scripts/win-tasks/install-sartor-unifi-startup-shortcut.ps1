# Install UniFi auto-start via a shortcut in the user's Startup folder.
# Runs at Alton's logon (no UAC required, runs as the current user).
# The wscript+VBS wrapper hides the console window.
#
# Trade vs scheduled task (the originally-planned path):
#   + No UAC prompt to register
#   + No interactive-session flash (VBS wrapper hides it)
#   - Runs at user logon, not at system boot. If Rocinante reboots and
#     stays at the lock screen without Alton signing in, UniFi doesn't
#     start. Acceptable trade for the household pattern (Alton is signed
#     in continuously).
#
# Idempotent: re-running replaces the existing shortcut.

$ErrorActionPreference = 'Stop'

$RepoRoot       = 'C:\Users\alto8\Sartor-claude-network'
$RunHidden      = Join-Path $RepoRoot 'scripts\win-tasks\run-hidden.vbs'
$Controller     = Join-Path $RepoRoot 'scripts\win-tasks\sartor-unifi-control.ps1'
$StartupDir     = [Environment]::GetFolderPath('Startup')
$ShortcutName   = 'Sartor UniFi Controller.lnk'
$ShortcutPath   = Join-Path $StartupDir $ShortcutName

if (-not (Test-Path $RunHidden))  { throw "Missing wrapper: $RunHidden" }
if (-not (Test-Path $Controller)) { throw "Missing controller script: $Controller" }
if (-not (Test-Path $StartupDir)) { throw "Startup folder not found: $StartupDir" }

$WshShell = New-Object -ComObject WScript.Shell
$Shortcut = $WshShell.CreateShortcut($ShortcutPath)
$Shortcut.TargetPath  = 'wscript.exe'
$Shortcut.Arguments   = "`"$RunHidden`" `"powershell.exe -NoProfile -ExecutionPolicy Bypass -File `"`"$Controller`"`" start`""
$Shortcut.WorkingDirectory = $RepoRoot
$Shortcut.WindowStyle = 7   # Minimized; wscript hides it anyway
$Shortcut.Description = 'Auto-start UniFi controller at user logon (Sartor)'
$Shortcut.Save()

Write-Host "Installed startup shortcut: $ShortcutPath"
Write-Host "Will run at next logon. To test now without rebooting, run:"
Write-Host "  powershell.exe -NoProfile -ExecutionPolicy Bypass -File `"$Controller`" status"
