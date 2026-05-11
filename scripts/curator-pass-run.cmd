@echo off
setlocal
set LOGFILE=C:\Users\alto8\generated\curator-pass-%date:~10,4%-%date:~4,2%-%date:~7,2%.log
cd /d C:\Users\alto8\Sartor-claude-network
echo === %date% %time% === >> "%LOGFILE%"
REM --max-drain 0 keeps the curator in dedup-skip-only mode after the
REM 2026-05-10 finding that the curator appends raw proposal-metadata
REM to target files. The dedup_status:already_landed filter (added
REM 2026-05-10) handles the bulk-skip; the remaining ~50 non-dedup
REM entries need human review before draining (includes health/medical
REM proposals targeting FAMILY.md). See sartor/memory/projects/
REM codebase-cleanup-2026-05-08/curator-behavior-postmortem-2026-05-10.md
REM Remove --max-drain 0 (or set to 100) to resume real drains.
python -m sartor.curator_pass -v --max-drain 0 >> "%LOGFILE%" 2>&1
exit /b %ERRORLEVEL%
