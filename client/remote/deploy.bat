@echo off
REM GameShare Remote Signaling Server Deployment Script

echo 🚀 Deploying GameShare Remote Signaling Server...

REM Check if Node.js is installed
node --version >nul 2>&1
if errorlevel 1 (
    echo ❌ Node.js is not installed. Please install Node.js 16+ first.
    exit /b 1
)

REM Check if npm is installed
npm --version >nul 2>&1
if errorlevel 1 (
    echo ❌ npm is not installed. Please install npm first.
    exit /b 1
)

REM Install dependencies
echo 📦 Installing dependencies...
npm install

REM Check if we're in a deployment environment
if defined FLY_APP_NAME (
    echo 🛩️  Deploying to Fly.io...
    fly deploy
) else if defined RAILWAY_TOKEN (
    echo 🚂 Deploying to Railway...
    railway up
) else if defined VERCEL_TOKEN (
    echo ▲ Deploying to Vercel...
    vercel --prod
) else (
    echo 🏠 Starting local development server...
    echo    Server will be available at: http://localhost:3000
    echo    WebSocket endpoint: ws://localhost:3000
    echo.
    echo    To test with a host:
    echo    ./gameshare-host --remote-signaling-url ws://localhost:3000
    echo.
    echo    To connect a client:
    echo    http://localhost:3000/?session=test-session
    echo.
    npm start
)

echo ✅ Deployment complete! 