@echo off
setlocal
title SafeHer Cab - Startup
set PROJECT_DIR=%~dp0
cd /d "%PROJECT_DIR%"

echo ----------------------------------------------------
echo 🌸 Starting SafeHer Cab - Women-Only Smart Cab System 🌸
echo ----------------------------------------------------

:: Check if Node.js is installed
node -v >nul 2>&1
if %errorlevel% neq 0 (
    echo [ERROR] Node.js is not installed!
    echo Please download and install it from https://nodejs.org/
    pause
    exit /b
)

:: Check for node_modules, install if missing
if not exist "node_modules\" (
    echo [INFO] First time setup: Installing dependencies...
    call npm install
)

:: Start the server in a new window so this window can open the browser
echo [INFO] Launching server...
start "SafeHer Server" cmd /c "npm start"

:: Wait for server to boot (3 seconds)
timeout /t 3 /nobreak >nul

:: Open the website
echo [INFO] Opening SafeHer Cab in your browser...
start http://localhost:3000

echo.
echo ----------------------------------------------------
echo ✅ SafeHer Cab is now running! 
echo Keep the [SafeHer Server] window open to use the app.
echo ----------------------------------------------------
echo.
pause
