@echo off
echo Starting HBMP Platform with Flow Builder Integration...
echo.

echo [1/3] Starting HBMP Backend and Frontend...
start "HBMP Platform" cmd /k "cd /d %~dp0 && pnpm dev"

timeout /t 5 /nobreak >nul

echo [2/3] Starting Flow Builder...
start "Flow Builder" cmd /k "cd /d %~dp0flow-builder && npm run dev"

echo.
echo [3/3] Integration Started!
echo.
echo Access Points:
echo - HBMP Platform: http://localhost:3000
echo - Flow Builder (Integrated): http://localhost:3000 (click Flow Builder card)
echo - Flow Builder (Standalone): http://localhost:5173
echo - API Server: http://localhost:3001
echo.
echo Press any key to stop all services...
pause >nul

taskkill /FI "WindowTitle eq HBMP Platform*" /T /F
taskkill /FI "WindowTitle eq Flow Builder*" /T /F
