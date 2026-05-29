@echo off
REM Sartor fleet ledger -- daily vast.ai revenue + state, power kWh, books, reconcile.
REM Registered as "SartorFleetLedger" Windows Scheduled Task (daily 23:45, S4U alton),
REM ahead of the 23:55 "Sartor Hours Log" task. Each step is idempotent; a failure in
REM one step does not abort the rest (we want partial progress + a log line).
setlocal
set LOGFILE=C:\Users\alto8\backups\fleet-ledger.log
set PY=C:\Python313\python.exe
set ROOT=C:\Users\alto8\Sartor-claude-network
cd /d %ROOT%
echo === %date% %time% === >> "%LOGFILE%"
"%PY%" "%ROOT%\scripts\fleet\vastai_pull.py"   >> "%LOGFILE%" 2>&1
"%PY%" "%ROOT%\scripts\fleet\power_ingest.py"  >> "%LOGFILE%" 2>&1
"%PY%" "%ROOT%\scripts\fleet\books.py"         >> "%LOGFILE%" 2>&1
"%PY%" "%ROOT%\scripts\fleet\reconcile.py"     >> "%LOGFILE%" 2>&1
echo --- fleet-ledger pass complete --- >> "%LOGFILE%"
exit /b 0
