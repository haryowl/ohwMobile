@echo off
REM OHW Mobile Application Deployment Script for Windows
REM This script builds the frontend and deploys to GitHub Pages

echo 🚀 Starting OHW Mobile Application Deployment...

REM Check if we're in the right directory
if not exist "package.json" (
    echo ❌ Error: package.json not found. Please run this script from the project root.
    pause
    exit /b 1
)

REM Install dependencies
echo 📦 Installing dependencies...
call npm install
cd frontend
call npm install
cd ..

REM Build frontend
echo 🔨 Building frontend...
cd frontend
call npm run build
cd ..

REM Check if build was successful
if not exist "frontend\build" (
    echo ❌ Error: Frontend build failed. Please check for errors.
    pause
    exit /b 1
)

echo ✅ Frontend build completed successfully!

REM Git operations
echo 📝 Committing changes...
git add .
git commit -m "Deploy: %date% %time% - Auto deployment"

echo 🚀 Pushing to GitHub...
git push origin main

echo 🎉 Deployment completed!
echo 📱 Mobile URL: https://haryowl.github.io/ohw-enhance/
echo 🔗 GitHub Repository: https://github.com/haryowl/ohw-enhance.git
echo.
echo 📋 Next steps:
echo 1. Wait for GitHub Actions to complete (check Actions tab)
echo 2. Visit https://haryowl.github.io/ohw-enhance/ to verify deployment
echo 3. Test mobile installation on your device
echo.
pause
