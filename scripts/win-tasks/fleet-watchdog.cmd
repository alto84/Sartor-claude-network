@echo off
REM Sartor fleet watchdog -- witness-side rental + host + thermal monitor. Runs ONE pass.
REM Registered as the "SartorFleetWatchdog" Windows Scheduled Task (every 10 min, S4U alton).
REM Checks (per machine in business/fleet.yaml): host-down, rental transition, price drift,
REM reliability, error_description, listing expiry, marginal floor, min_gpus, GPU temp; plus
REM Rocinante's own disk. Writes inbox alert + data/financial/solar-inference/fleet-health.json;
REM phone alert on ORANGE+ if watchdog-notify.yaml is configured. Read-only against the fleet.
setlocal
set LOGFILE=C:\Users\alto8\backups\fleet-watchdog.log
cd /d C:\Users\alto8\Sartor-claude-network
echo === %date% %time% === >> "%LOGFILE%"
"C:\Python313\python.exe" "C:\Users\alto8\Sartor-claude-network\scripts\fleet-watchdog.py" >> "%LOGFILE%" 2>&1
exit /b %ERRORLEVEL%
