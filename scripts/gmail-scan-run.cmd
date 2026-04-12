@echo off
setlocal
set LOGFILE=C:\Users\alto8\generated\gmail-scan-%date:~10,4%-%date:~4,2%-%date:~7,2%.log
cd /d C:\Users\alto8\Sartor-claude-network
echo === %date% %time% === >> "%LOGFILE%"
python -m sartor.gmail_scan -v >> "%LOGFILE%" 2>&1
exit /b %ERRORLEVEL%
