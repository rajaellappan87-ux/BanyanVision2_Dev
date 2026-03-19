@echo off
echo.
echo ================================================
echo   BanyanVision - Git Branch Setup
echo   Dev branch → main (current)
echo   Prod branch → prod (new)
echo ================================================
echo.

cd /d D:\Raja\Misc\BV\BanyanVision

echo [1/6] Checking current branch...
git branch
echo.

echo [2/6] Making sure main branch is up to date...
git add .
git status
echo.

set /p MSG="Enter commit message for current dev work (or press Enter to skip): "
if not "%MSG%"=="" (
    git commit -m "%MSG%"
)
echo.

echo [3/6] Push latest dev work to main...
git push origin main
echo.

echo [4/6] Creating prod branch from main...
git checkout -b prod
echo.

echo [5/6] Pushing prod branch to GitHub...
git push -u origin prod
echo.

echo [6/6] Switching back to main (dev) branch...
git checkout main
echo.

echo ================================================
echo   DONE! Branch structure:
echo.
echo   main  → Development branch (you work here)
echo   prod  → Production branch  (launch from here)
echo.
echo   GitHub branches created successfully!
echo ================================================
echo.
pause
