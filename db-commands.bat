@echo off
echo.
echo ╔══════════════════════════════════════════════════════════╗
echo ║   BanyanVision — Database Sync Commands                  ║
echo ╚══════════════════════════════════════════════════════════╝
echo.
echo   [1] Status      — Show record counts in Dev and Prod DB
echo   [2] Push Safe   — Dev → Prod  (Settings, Products, Coupons)
echo   [3] Push All    — Dev → Prod  (Everything, asks confirmation)
echo   [4] Pull All    — Prod → Dev  (Reproduce production issue)
echo   [5] Pull Custom — Prod → Dev  (Select specific collections)
echo   [6] Exit
echo.
set /p choice="   Enter choice (1-6): "

cd /d D:\Raja\Misc\BV\BanyanVision\backend

if "%choice%"=="1" (
    echo.
    node db-sync.js status
)
if "%choice%"=="2" (
    echo.
    echo Pushing safe collections (Settings, Products, Coupons, Reviews) to Prod...
    node db-sync.js push --safe
)
if "%choice%"=="3" (
    echo.
    echo Pushing ALL collections to Prod (you will be asked to confirm risky ones)...
    node db-sync.js push --all
)
if "%choice%"=="4" (
    echo.
    echo Pulling ALL collections from Prod to Dev...
    node db-sync.js pull --all
)
if "%choice%"=="5" (
    echo.
    set /p cols="   Enter collection names (e.g. Order,User): "
    node db-sync.js pull --collections=%cols%
)
if "%choice%"=="6" exit

echo.
pause
