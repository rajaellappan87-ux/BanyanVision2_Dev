@echo off
cd /d D:\Raja\BV\SourceCode\BV_SourceCode\Dev

git config user.name "rajaellappan87-ux"
git config user.email "rajaellappan87@gmail.com"

echo ================================================
echo   BanyanVision - Push changes to MAIN (dev)
echo ================================================
echo:

echo Files changed:
git status --short
echo:

git add .

set /p MSG="Enter commit message: "
if "%MSG%"=="" set MSG=Dev update - %DATE% %TIME%

git commit -m "%MSG%"

git push origin main

if %ERRORLEVEL%==0 (
    echo:
    echo   SUCCESS - Changes pushed to main branch.
    echo   Run deploy-to-prod.bat when ready for production.
) else (
    echo:
    echo   ERROR - Push failed. Check above for details.
)
echo:
pause
