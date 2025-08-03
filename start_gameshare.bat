@echo off
echo ========================================
echo    GameShare Windows - Browser Edition
echo ========================================
echo.

REM Check if Python is available
python --version >nul 2>&1
if %errorlevel% neq 0 (
    echo Error: Python is not installed or not in PATH
    echo Please install Python from https://www.python.org/
    pause
    exit /b 1
)

echo Starting GameShare web server...
echo.
echo Server will run at: http://localhost:8080
echo.
echo Instructions:
echo 1. Open your browser and go to http://localhost:8080
echo 2. Click "Start as Host" to share your screen
echo 3. Open another tab and click "Join as Client" to view
echo.
echo To connect from another device on your network:
echo - Find your IP with: ipconfig
echo - Connect to: http://YOUR_IP:8080
echo.
echo Press Ctrl+C to stop the server
echo.

REM Start the server
python -m http.server 8080