@echo off
echo.
echo ================================================
echo   BanyanVision - Save work to main (dev)
echo ================================================
echo.

cd /d D:\Raja\BV\SourceCode\BanyanVision2_Dev

git config user.name "rajaellappan87-ux"
git config user.email "rajaellappan87@gmail.com"

echo [1/4] Files changed:
git status --short
echo.

echo [2/4] Staging all changes...
git add .
echo.

set /p MSG="Commit message (or press Enter for auto): "
if "%MSG%"=="" set MSG=Dev update - %DATE% %TIME%

echo [3/4] Committing: "%MSG%"
git commit -m "%MSG%"
echo.

echo [4/4] Pushing to main (dev) branch...
git push origin main
echo.

if %ERRORLEVEL%==0 (
    echo ================================================
    echo   Saved to main branch successfully!
    echo   Run deploy-to-prod.bat when ready to launch.
    echo ================================================
) else (
    echo ================================================
    echo   ERROR - Check above for details.
    echo ================================================
)
echo.
pause
