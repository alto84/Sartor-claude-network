# Register the SartorConversationExtract scheduled task.
# Run from an elevated PowerShell prompt on Rocinante.
# This script does NOT install -- it registers the task definition so
# Alton can review and enable at his discretion.

$TaskName = "SartorConversationExtract"
$XmlPath  = Join-Path $PSScriptRoot "conversation-extract-task.xml"

if (-not (Test-Path $XmlPath)) {
    Write-Error "Task XML not found at $XmlPath"
    exit 1
}

Write-Host "Registering scheduled task '$TaskName' from $XmlPath ..."
Register-ScheduledTask -TaskName $TaskName -Xml (Get-Content $XmlPath -Raw) -Force
Write-Host "Done. Task registered but may need to be enabled manually."
Write-Host "To run immediately:  Start-ScheduledTask -TaskName $TaskName"
