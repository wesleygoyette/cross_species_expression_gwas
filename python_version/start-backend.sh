#!/bin/bash

# Start script for the Regulatory Landscapes backend
echo "Starting Regulatory Landscapes Backend..."

# Navigate to backend directory
cd "$(dirname "$0")/backend"

# Activate virtual environment
if [ -d "venv" ]; then
    echo "Activating virtual environment..."
    source venv/bin/activate
else
    echo "Virtual environment not found. Please run setup first."
    exit 1
fi

# Start Django development server
echo "Starting Django server on http://localhost:8000/"
python manage.py runserver