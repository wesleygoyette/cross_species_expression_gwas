#!/bin/bash
set -e

cd "$(dirname "$0")/backend"

# Check if .env file exists
if [ ! -f ".env" ]; then
    echo "❌ Environment file not found!"
    echo "Please run: cp .env.example .env"
    echo "Then edit .env and update the SECRET_KEY"
    echo "Generate a secure key with: python -c \"from django.core.management.utils import get_random_secret_key; print(get_random_secret_key())\""
    exit 1
fi

# Check if virtual environment exists
if [ ! -d "venv" ]; then
    echo "🐍 Creating virtual environment..."
    python3 -m venv venv
    echo "📦 Installing dependencies..."
    ./venv/bin/pip install -r requirements.txt
fi

echo "🚀 Starting Django backend server..."
./venv/bin/python manage.py runserver