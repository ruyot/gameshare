@echo off
echo =========================================
echo    GameShare - Remote Gaming Edition
echo =========================================
echo.

REM Check if Python is available
python --version >nul 2>&1
if %errorlevel% neq 0 (
    echo Error: Python is not installed or not in PATH
    echo Please install Python from https://www.python.org/
    echo.
    echo You need Python to run the input bridge that allows remote control
    pause
    exit /b 1
)

echo Starting GameShare components...
echo.

REM Start the input bridge in a new window
echo 1. Starting Input Bridge (for game controls)...
start "GameShare Input Bridge" cmd /k python input_bridge.py

REM Give it a moment to start
timeout /t 2 /nobreak >nul

REM Start the web server in a new window
echo 2. Starting Web Server...
start "GameShare Web Server" cmd /k python -m http.server 8080

REM Give it a moment to start
timeout /t 2 /nobreak >nul

REM Open the browser
echo 3. Opening GameShare in browser...
start http://localhost:8080

echo.
echo =========================================
echo    GameShare is now running!
echo =========================================
echo.
echo To share a game:
echo 1. Click "Gaming Host" in the browser
echo 2. Start your game in WINDOWED MODE
echo 3. Click "Start Game Sharing"
echo 4. Select your game window
echo 5. Share the session ID with your friend
echo.
echo Your friend can control the game by:
echo 1. Clicking "Gaming Client"
echo 2. Entering the session ID
echo 3. Clicking on the video to capture controls
echo.
echo Press any key to stop all services...
pause >nul

REM Kill the processes
echo.
echo Stopping services...
taskkill /F /FI "WINDOWTITLE eq GameShare Input Bridge*" >nul 2>&1
taskkill /F /FI "WINDOWTITLE eq GameShare Web Server*" >nul 2>&1

echo Done!