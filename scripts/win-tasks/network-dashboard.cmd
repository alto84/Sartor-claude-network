@echo off
REM Network dashboard regenerator. Pulls live UniFi state, writes
REM sartor/memory/wifi/network-dashboard.html. Browser auto-reloads
REM every 60 sec via meta-refresh; this regenerates underlying data
REM every 5 min via the "Sartor Network Dashboard" Windows Scheduled Task.
REM
REM Read-only against the UniFi controller.
setlocal
set LOGFILE=C:\Users\alto8\backups\network-dashboard.log
cd /d C:\Users\alto8\Sartor-claude-network
echo === %date% %time% === >> "%LOGFILE%"
"C:\Python313\python.exe" "C:\Users\alto8\Sartor-claude-network\sartor\memory\wifi\dashboard\generate-dashboard.py" >> "%LOGFILE%" 2>&1
exit /b %ERRORLEVEL%
