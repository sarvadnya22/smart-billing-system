@echo off
title Smart Billing System - Setup & Launch

echo =======================================================
echo     SMART BILLING SYSTEM - INITIALIZING ENVIRONMENT     
echo =======================================================
echo.

:: 1. Check if Node.js is installed
node -v >nul 2>&1
if %errorlevel% neq 0 (
    echo [WARNING] Node.js is not installed on this system!
    echo.
    echo The billing system will still run, but it will automatically
    echo fall back to "Offline Mode" (browser LocalStorage).
    echo.
    echo To use the SQL Database backend:
    echo 1. Download and install Node.js from: https://nodejs.org/
    echo 2. Restart this script after installation.
    echo.
    echo Launching frontend in Offline Mode now...
    timeout /t 5 >nul
    start index.html
    exit
)

:: 2. Check if node_modules dependencies folder exists
if not exist "node_modules\" (
    echo [INFO] First time launch detected. Installing required packages...
    echo This might take a few moments. Please wait...
    echo.
    call npm install
    if %errorlevel% neq 0 (
        echo.
        echo [ERROR] Installation failed! Please check your internet connection.
        echo Launching frontend in LocalStorage fallback mode instead.
        timeout /t 5 >nul
        start index.html
        exit
    )
    echo.
    echo [SUCCESS] Dependencies installed successfully!
    echo.
)

:: 3. Launch the Backend Server in a new separate console window
echo [INFO] Starting SQL Backend Server (Node.js + SQLite)...
start "Smart Billing Backend Server" cmd /k "title SQL Server Log && node server.js"

:: 4. Wait for server startup to complete
echo [INFO] Waiting for server to initialize...
timeout /t 3 >nul

:: 5. Open the frontend website
echo [INFO] Launching Frontend Interface...
start index.html

echo.
echo =======================================================
echo             LAUNCH COMPLETED SUCCESSFULLY!             
echo   (Keep the background SQL server command window open)   
echo =======================================================
echo.
timeout /t 4 >nul
exit
