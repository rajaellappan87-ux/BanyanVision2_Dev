@echo off
echo.
echo ================================================
echo   BanyanVision — Backend Diagnostics
echo ================================================
echo.

cd /d D:\Raja\Misc\BV\BanyanVision\backend

echo [1] Checking Node.js...
node --version
if %ERRORLEVEL% NEQ 0 (echo    ERROR: Node.js not installed! && pause && exit)

echo.
echo [2] Checking npm packages...
if not exist node_modules (
    echo    node_modules missing — running npm install...
    npm install
) else (
    echo    node_modules found OK
)

echo.
echo [3] Checking .env file...
if not exist .env (
    echo    ERROR: .env file is missing!
    echo    Copy .env.example to .env and fill in your values.
    pause && exit
) else (
    echo    .env file found OK
)

echo.
echo [4] Checking MONGO_URI in .env...
findstr /i "MONGO_URI" .env
echo.

echo [5] Checking port 5000 is free...
netstat -ano | findstr ":5000"
if %ERRORLEVEL% EQU 0 (
    echo    WARNING: Port 5000 is already in use!
    echo    Kill the process using it or restart your PC.
) else (
    echo    Port 5000 is free OK
)

echo.
echo [6] Starting backend server (watch for errors below)...
echo ================================================
echo.
npm run dev

pause
