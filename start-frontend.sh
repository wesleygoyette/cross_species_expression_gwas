#!/bin/bash

# Start script for the Regulatory Landscapes frontend
echo "Starting Regulatory Landscapes Frontend..."

# Navigate to frontend directory
cd "$(dirname "$0")/frontend"

# Check if node_modules exists
if [ ! -d "node_modules" ]; then
    echo "Installing Node.js dependencies..."
    npm install
fi

# Start React development server
echo "Starting React server on http://localhost:3000/"
npm start