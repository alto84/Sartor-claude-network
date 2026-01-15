@echo off
echo Starting Sartor MCP Server with ngrok...
echo.

cd /d "%~dp0"

:: Start the MCP server in a new window
start "MCP Server" cmd /c "node dist\index.js"

:: Wait a moment for the server to start
timeout /t 3 /nobreak >nul

:: Start ngrok
echo Starting ngrok tunnel...
ngrok http 3001

pause
