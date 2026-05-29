@echo off
REM Sartor fleet repricer -- adaptive market pricing for rtxserver (124192). Runs ONE pass.
REM Registered as the "SartorFleetReprice" Windows Scheduled Task (every 15 min, S4U alton).
REM Anchors to the 2nd-cheapest comparable RTX PRO 6000 listing (per-GPU, with strict-2-GPU
REM preference + per-GPU fallback), adapts a demand multiplier from fill-latency / idle, bounded
REM by electricity floor + peer ceiling + per-run step cap. Sets the vast.ai listing price and
REM updates business/fleet.yaml; logs every decision to data/financial/solar-inference/reprice-log.jsonl.
REM Preserves the min_gpus=2 thermal invariant on every relist. See scripts/fleet/reprice.py.
setlocal
set LOGFILE=C:\Users\alto8\backups\fleet-reprice.log
cd /d C:\Users\alto8\Sartor-claude-network
echo === %date% %time% === >> "%LOGFILE%"
"C:\Python313\python.exe" "C:\Users\alto8\Sartor-claude-network\scripts\fleet\reprice.py" >> "%LOGFILE%" 2>&1
exit /b %ERRORLEVEL%
