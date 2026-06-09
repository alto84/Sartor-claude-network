# bw-vault-register-task.ps1 — register the "Sartor Vault Session Renew"
# scheduled task (logon + every 4h). REQUIRES ELEVATION (same constraint as
# register-fleet-tasks.ps1: S4U registration needs admin).
#
# Run: Start-Process powershell -Verb RunAs -ArgumentList
#      '-NoProfile -ExecutionPolicy Bypass -File <this file>'

$action = New-ScheduledTaskAction -Execute 'powershell.exe' -Argument '-NoProfile -ExecutionPolicy Bypass -File C:\Users\alto8\Sartor-claude-network\scripts\win-tasks\bw-session-renew.ps1'
$t1 = New-ScheduledTaskTrigger -AtLogOn
$t2 = New-ScheduledTaskTrigger -Once -At (Get-Date).Date -RepetitionInterval (New-TimeSpan -Hours 4) -RepetitionDuration (New-TimeSpan -Days 3650)
$settings = New-ScheduledTaskSettingsSet -StartWhenAvailable -DontStopOnIdleEnd
Register-ScheduledTask -TaskName 'Sartor Vault Session Renew' -Action $action -Trigger $t1, $t2 -Settings $settings -Description 'Re-derives the Bitwarden CLI session from the DPAPI-protected master password whenever the cached session is invalid. Seeded by bw-vault-seed.ps1. Uplift C2-structural 2026-06-09.' -Force | Out-Null
Write-Host "Registered: Sartor Vault Session Renew (logon + every 4h)."
Start-Sleep -Seconds 3
