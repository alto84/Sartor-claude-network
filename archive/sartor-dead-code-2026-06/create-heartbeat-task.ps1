# Create Windows Scheduled Task for Sartor Heartbeat
# Runs every 30 minutes

$taskName = "SartorHeartbeat"
$pythonPath = (Get-Command python).Source
$scriptPath = "C:\Users\alto8\Sartor-claude-network\sartor\heartbeat.py"
$workingDir = "C:\Users\alto8\Sartor-claude-network"

# Remove existing task if present
schtasks /delete /tn $taskName /f 2>$null

# Create the action
$action = New-ScheduledTaskAction -Execute $pythonPath -Argument $scriptPath -WorkingDirectory $workingDir

# Trigger: every 30 minutes, indefinitely
$trigger = New-ScheduledTaskTrigger -Once -At (Get-Date) -RepetitionInterval (New-TimeSpan -Minutes 30)

# Settings: run whether user is logged in, don't stop if running longer, allow on battery
$settings = New-ScheduledTaskSettingsSet -AllowStartIfOnBatteries -DontStopIfGoingOnBatteries -StartWhenAvailable -MultipleInstances IgnoreNew -ExecutionTimeLimit (New-TimeSpan -Minutes 10)

# Register the task
Register-ScheduledTask -TaskName $taskName -Action $action -Trigger $trigger -Settings $settings -Description "Sartor KAIROS heartbeat engine - runs health checks and scheduled tasks every 30 minutes" -Force

Write-Host "Task '$taskName' created successfully."
Get-ScheduledTask -TaskName $taskName | Format-List TaskName, State, Description
