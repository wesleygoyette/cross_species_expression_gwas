#!/bin/bash

# Start script for the Regulatory Landscapes frontend
echo "Starting Regulatory Landscapes Frontend..."

# Navigate to frontend directory
cd "$(dirname "$0")/frontend"

# Check if .env file exists
if [ ! -f ".env" ]; then
    echo "❌ Environment file not found!"
    echo "Please run: cp .env.example .env"
    echo "The default values should work for local development."
    exit 1
fi

# Check if node_modules exists
if [ ! -d "node_modules" ]; then
    echo "📦 Installing Node.js dependencies..."
    npm install
fi

# Start React development server
echo "🚀 Starting React server on http://localhost:3000/"
npm start