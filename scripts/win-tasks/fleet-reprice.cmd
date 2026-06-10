@echo off
REM Sartor fleet repricer v3 -- adaptive market pricing for every fleet.yaml machine with
REM listing.dynamic.enabled (124192 now; gpuserver1 enrolls 2026-08-24; new 5090s at onboarding).
REM Registered as the "SartorFleetReprice" Windows Scheduled Task (every 15 min, S4U alton).
REM Per machine: anchors to the ~P40 comparable listing (own fleet excluded), learns occupancy
REM per relative-price band (UCB bandit, optimistic prior = skim-then-descend), bounded by
REM electricity floor + P75 peer ceiling + step cap; relists only when idle. Sets the vast.ai
REM price, updates business/fleet.yaml, logs to data/financial/solar-inference/reprice-log-<id>.jsonl.
REM Preserves the min_gpus=2 thermal invariant on 124192. See scripts/fleet/reprice.py.
setlocal
set LOGFILE=C:\Users\alto8\backups\fleet-reprice.log
cd /d C:\Users\alto8\Sartor-claude-network
echo === %date% %time% === >> "%LOGFILE%"
"C:\Python313\python.exe" "C:\Users\alto8\Sartor-claude-network\scripts\fleet\reprice.py" >> "%LOGFILE%" 2>&1
exit /b %ERRORLEVEL%
