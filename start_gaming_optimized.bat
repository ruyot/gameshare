@echo off
echo =========================================
echo    GameShare - Optimized for Windows
echo    (No IP Helper service overhead)
echo =========================================
echo.

REM Check if Python is available
python --version >nul 2>&1
if %errorlevel% neq 0 (
    echo Error: Python is not installed or not in PATH
    echo Please install Python from https://www.python.org/
    pause
    exit /b 1
)

echo Starting GameShare components...
echo.

REM Kill any existing Python processes
echo Cleaning up old processes...
taskkill /F /IM python.exe >nul 2>&1

REM Give it a moment
timeout /t 1 /nobreak >nul

REM Start the direct input bridge (file-based, no network)
echo 1. Starting Direct Input Bridge (no network overhead)...
start "GameShare Input Bridge" cmd /k python input_bridge_direct.py

REM Give it a moment to start
timeout /t 2 /nobreak >nul

REM Start the web server with input handling
echo 2. Starting Web Server with input API...
start "GameShare Web Server" cmd /k python web_server_with_input.py

REM Give it a moment to start
timeout /t 2 /nobreak >nul

REM Open the browser
echo 3. Opening GameShare in browser...
start http://localhost:8080

echo.
echo =========================================
echo    GameShare is now running!
echo    (Optimized - No IP Helper overhead)
echo =========================================
echo.
echo This version uses file-based communication
echo instead of WebSockets to avoid Windows
echo IP Helper service CPU usage.
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

REM Clean up input files
echo Cleaning up temporary files...
if exist gameshare_input\commands.txt del gameshare_input\commands.txt
if exist gameshare_input\processed.txt del gameshare_input\processed.txt

echo Done!