@echo off
echo Starting Sartor MCP Server...
echo.
cd /d "%~dp0"
node dist\index.js
pause
