#!/bin/bash

# GameShare Remote Signaling Server Deployment Script

set -e

echo "🚀 Deploying GameShare Remote Signaling Server..."

# Check if Node.js is installed
if ! command -v node &> /dev/null; then
    echo "❌ Node.js is not installed. Please install Node.js 16+ first."
    exit 1
fi

# Check if npm is installed
if ! command -v npm &> /dev/null; then
    echo "❌ npm is not installed. Please install npm first."
    exit 1
fi

# Install dependencies
echo "📦 Installing dependencies..."
npm install

# Check if we're in a deployment environment
if [ -n "$FLY_APP_NAME" ]; then
    echo "🛩️  Deploying to Fly.io..."
    fly deploy
elif [ -n "$RAILWAY_TOKEN" ]; then
    echo "🚂 Deploying to Railway..."
    railway up
elif [ -n "$VERCEL_TOKEN" ]; then
    echo "▲ Deploying to Vercel..."
    vercel --prod
else
    echo "🏠 Starting local development server..."
    echo "   Server will be available at: http://localhost:3000"
    echo "   WebSocket endpoint: ws://localhost:3000"
    echo ""
    echo "   To test with a host:"
    echo "   ./gameshare-host --remote-signaling-url ws://localhost:3000"
    echo ""
    echo "   To connect a client:"
    echo "   http://localhost:3000/?session=test-session"
    echo ""
    npm start
fi

echo "✅ Deployment complete!" 