@echo off
echo ================================================
echo   BanyanVision - Deploy main to prod
echo   Merges tested dev code into prod branch
echo ================================================
echo:

cd /d D:\Raja\BV\SourceCode\BanyanVision2_Dev

git config user.name "rajaellappan87-ux"
git config user.email "rajaellappan87@gmail.com"

echo [1/8] Current branch status...
git branch
git status
echo:

echo [2/8] Save any unsaved work on main...
git add .
set /p MSG="Commit message for this release (e.g. v1.2 - added new products): "
if "%MSG%"=="" set MSG=Release to prod - %DATE%
git commit -m "%MSG%"
echo:

echo [3/8] Push latest main to GitHub...
git push origin main
echo:

echo [4/8] Switch to prod branch...
git checkout prod
echo:

echo [5/8] Pull latest prod from GitHub...
git pull origin prod
echo:

echo [6/8] Merge main into prod...
git merge main --no-ff -m "Merge main into prod: %MSG%"
echo:

echo [7/8] Push prod to GitHub...
git push origin prod
echo:

echo [8/8] Switch back to main for continued dev work...
git checkout main
echo:

echo ================================================
echo   DEPLOYED SUCCESSFULLY!
echo   prod branch is now up to date with main.
echo   Railway/Vercel will auto-deploy from prod.
echo   You are back on main branch for dev work.
echo ================================================
echo:
pause
