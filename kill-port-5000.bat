@echo off
echo.
echo ================================================
echo   Kill whatever is running on port 5000
echo ================================================
echo.

echo [1] Finding process on port 5000...
for /f "tokens=5" %%a in ('netstat -ano ^| findstr ":5000 "') do (
    echo     Found PID: %%a
    echo     Killing PID %%a...
    taskkill /PID %%a /F >nul 2>&1
)

echo.
echo [2] Verifying port is free...
netstat -ano | findstr ":5000"
if %ERRORLEVEL% EQU 0 (
    echo     WARNING: Port still in use — try restarting your PC
) else (
    echo     Port 5000 is now free!
)

echo.
echo [3] Starting backend...
cd /d D:\Raja\Misc\BV\BanyanVision\backend
npm run dev

pause
