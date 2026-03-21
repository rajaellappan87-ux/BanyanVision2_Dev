@echo off
title BanyanVision Backend
echo.
echo ================================================
echo   BanyanVision Backend — Development Server
echo ================================================
echo.

cd /d D:\Raja\Misc\BV\BanyanVision\backend

:CHECK_ENV
echo [1/3] Checking .env...
if not exist .env (
    echo ❌ .env file missing! Copy .env.example to .env first.
    pause & exit
)

echo [2/3] Checking dependencies...
if not exist node_modules (
    echo Installing packages...
    call npm install
)

:KILL_PORT
echo [3/3] Clearing port 5000...
for /f "tokens=5" %%a in ('netstat -ano 2^>nul ^| findstr ":5000 "') do (
    taskkill /PID %%a /F >nul 2>&1
)
timeout /t 1 /nobreak >nul

:START
echo.
echo Starting server... (auto-restarts on crash)
echo Press Ctrl+C to stop.
echo ================================================
echo.

call npm run dev

echo.
echo ⚠️  Server stopped. Auto-restarting in 3 seconds...
echo    (Press Ctrl+C now to cancel)
timeout /t 3 /nobreak >nul
goto START
