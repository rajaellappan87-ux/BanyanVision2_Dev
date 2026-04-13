@echo off
cd /d D:\Raja\BV\SourceCode\BV_SourceCode\Dev

git config user.name "rajaellappan87-ux"
git config user.email "rajaellappan87@gmail.com"

echo ================================================
echo   BanyanVision - Deploy MAIN to PROD
echo ================================================
echo:

echo Switching to prod branch...
git checkout prod

echo:
echo Pulling latest prod from remote...
git pull origin prod

echo:
echo Merging main into prod...
set /p MSG="Enter release message (e.g. v1.2 - new feature): "
if "%MSG%"=="" set MSG=Release - %DATE%

git merge origin/main --no-ff -m "Merge main into prod: %MSG%"

echo:
echo Pushing prod to GitHub...
git push origin prod

echo:
echo Switching back to main...
git checkout main

if %ERRORLEVEL%==0 (
    echo:
    echo   SUCCESS - prod branch updated and pushed.
    echo   Your production server will auto-deploy now.
) else (
    echo:
    echo   ERROR - Check above for details.
)
echo:
pause
