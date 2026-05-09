@echo off
REM Registry drift check - Tier 4 of the IP-graceful-reassignment architecture.
REM Walks sartor/memory/machines/REGISTRY.yaml, pings each machine, attempts
REM SSH liveness where ssh_path is declared, writes a dated report to
REM sartor/memory/inbox/rocinante/, updates last_verified for OK machines,
REM and exits non-zero on any drift so cron-fail surfaces.
REM
REM Wired by the "Sartor Registry Drift Check" Windows Scheduled Task (every 4h).
REM Invoked through scripts/win-tasks/run-hidden.vbs per the convention in
REM sartor/memory/reference_scheduled_tasks.md.
setlocal
set LOGFILE=C:\Users\alto8\backups\registry-drift-check.log
cd /d C:\Users\alto8\Sartor-claude-network
echo === %date% %time% === >> "%LOGFILE%"
"C:\Python313\python.exe" "C:\Users\alto8\Sartor-claude-network\sartor\memory\machines\check-registry.py" >> "%LOGFILE%" 2>&1
exit /b %ERRORLEVEL%
