@echo off
REM Sartor fleet watchdog -- SLIM witness-side liveness + price-drift monitor. Runs ONE pass.
REM Registered as the "SartorFleetWatchdog" Windows Scheduled Task (every 10 min, S4U alton).
REM Checks (per machine in business/fleet.yaml): host-down, rental transition, price drift,
REM stale sentinel heartbeat; plus Rocinante's own disk. Host hardware/rental detail (temp,
REM reliability, error_description, expiry, floor, min_gpus) is now self-reported every 5 min by
REM fleet-sentinel into sartor/memory/fleet-log/<host>.ndjson. Writes inbox alert +
REM data/financial/solar-inference/fleet-health.json; phone alert on ORANGE+ if
REM watchdog-notify.yaml is configured. Read-only against the fleet.
setlocal
set LOGFILE=C:\Users\alto8\backups\fleet-watchdog.log
cd /d C:\Users\alto8\Sartor-claude-network
echo === %date% %time% === >> "%LOGFILE%"
"C:\Python313\python.exe" "C:\Users\alto8\Sartor-claude-network\scripts\fleet-watchdog.py" >> "%LOGFILE%" 2>&1
exit /b %ERRORLEVEL%
