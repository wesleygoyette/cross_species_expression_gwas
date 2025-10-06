#!/bin/bash

echo "🔧 Setting up Regulatory Landscapes project..."

# Check if we're in the right directory
if [ ! -f "README.md" ] || [ ! -d "backend" ] || [ ! -d "frontend" ]; then
    echo "❌ Please run this script from the project root directory"
    exit 1
fi

# Set up backend environment
echo "📝 Setting up backend environment..."
if [ ! -f "backend/.env" ]; then
    cp backend/.env.example backend/.env
    echo "✅ Created backend/.env from template"
    echo "⚠️  Please edit backend/.env and update the SECRET_KEY"
    echo "   Generate a secure key with: cd backend && python -c \"from django.core.management.utils import get_random_secret_key; print(get_random_secret_key())\""
else
    echo "✅ Backend .env already exists"
fi

# Set up frontend environment  
echo "📝 Setting up frontend environment..."
if [ ! -f "frontend/.env" ]; then
    cp frontend/.env.example frontend/.env
    echo "✅ Created frontend/.env from template"
else
    echo "✅ Frontend .env already exists"
fi

# Set up backend virtual environment
echo "🐍 Setting up Python virtual environment..."
cd backend
if [ ! -d "venv" ]; then
    python3 -m venv venv
    echo "✅ Created virtual environment"
    echo "📦 Installing Python dependencies..."
    ./venv/bin/pip install -r requirements.txt
    echo "✅ Installed Python dependencies"
else
    echo "✅ Virtual environment already exists"
fi
cd ..

# Set up frontend dependencies
echo "📦 Setting up Node.js dependencies..."
cd frontend
if [ ! -d "node_modules" ]; then
    npm install
    echo "✅ Installed Node.js dependencies"
else
    echo "✅ Node.js dependencies already installed"
fi
cd ..

echo ""
echo "🎉 Setup complete!"
echo ""
echo "Next steps:"
echo "1. Edit backend/.env and update the SECRET_KEY"
echo "2. Run ./start-dev-backend.sh to start the backend"
echo "3. Run ./start-dev-frontend.sh to start the frontend"
echo ""
echo "The app will be available at:"
echo "  Frontend: http://localhost:3000"
echo "  Backend:  http://localhost:8000"