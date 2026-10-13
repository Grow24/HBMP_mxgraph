@echo off
echo ========================================
echo Triggering n8n Workflow Demo
echo ========================================
echo.

REM REPLACE THIS URL with your actual webhook URL from n8n
set WEBHOOK_URL=http://localhost:5678/webhook-test/customer-feedback

echo Sending test data to n8n...
echo.

curl -X POST %WEBHOOK_URL% ^
  -H "Content-Type: application/json" ^
  -d "{\"customer\":\"John Doe\",\"email\":\"john@example.com\",\"rating\":5,\"comment\":\"Great service!\",\"timestamp\":\"%date% %time%\"}"

echo.
echo ========================================
echo Done! Check n8n for execution results
echo ========================================
pause
