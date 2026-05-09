@echo off
REM Tier-A WiFi health monitor - priority-aware observability for the
REM Sartor-Saxena-Claude Network. Walks every wireless client + AP radio
REM every 15 minutes, applies per-priority-tier thresholds from
REM sartor/memory/wifi/CLIENT-PRIORITIES.yaml, writes a dated audit-trail
REM report to sartor/memory/inbox/rocinante/, and exits non-zero on any
REM alert so cron-fail surfaces in Task Scheduler's LastTaskResult.
REM
REM Read-only against the UniFi controller. Zero PUTs/POSTs that mutate state.
REM
REM Wired by the "Sartor WiFi Health Monitor" Windows Scheduled Task (every
REM 15 min, NOT YET REGISTERED - awaiting Alton greenlight). Invoked through
REM scripts/win-tasks/run-hidden.vbs per the convention in
REM sartor/memory/reference_scheduled_tasks.md.
setlocal
set LOGFILE=C:\Users\alto8\backups\wifi-health-monitor.log
cd /d C:\Users\alto8\Sartor-claude-network
echo === %date% %time% === >> "%LOGFILE%"
"C:\Python313\python.exe" "C:\Users\alto8\Sartor-claude-network\sartor\memory\wifi\wifi-health-monitor.py" >> "%LOGFILE%" 2>&1
exit /b %ERRORLEVEL%
