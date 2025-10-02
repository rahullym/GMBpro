#!/bin/bash

# GMB Optimizer Setup Script
echo "🚀 Setting up GMB Optimizer..."

# Check if Docker is running
if ! docker info > /dev/null 2>&1; then
    echo "❌ Docker is not running. Please start Docker and try again."
    exit 1
fi

# Check if Node.js is installed
if ! command -v node &> /dev/null; then
    echo "❌ Node.js is not installed. Please install Node.js 18+ and try again."
    exit 1
fi

# Check Node.js version
NODE_VERSION=$(node -v | cut -d'v' -f2 | cut -d'.' -f1)
if [ "$NODE_VERSION" -lt 18 ]; then
    echo "❌ Node.js version 18+ is required. Current version: $(node -v)"
    exit 1
fi

echo "✅ Prerequisites check passed"

# Copy environment file if it doesn't exist
if [ ! -f .env ]; then
    echo "📝 Creating environment file..."
    cp env.example .env
    echo "⚠️  Please update .env file with your actual configuration values"
fi

# Install dependencies
echo "📦 Installing dependencies..."
npm install

# Start Docker services
echo "🐳 Starting Docker services..."
docker-compose up -d postgres redis

# Wait for services to be ready
echo "⏳ Waiting for services to be ready..."
sleep 10

# Run database migrations
echo "🗄️  Running database migrations..."
cd apps/backend
npm run prisma:migrate

# Generate Prisma client
echo "🔧 Generating Prisma client..."
npm run prisma:generate

# Seed database with sample data
echo "🌱 Seeding database..."
npm run prisma:seed

cd ../..

echo "✅ Setup completed successfully!"
echo ""
echo "🎉 GMB Optimizer is ready to use!"
echo ""
echo "Next steps:"
echo "1. Update .env file with your actual configuration values"
echo "2. Start the development servers: npm run dev"
echo "3. Open http://localhost:3000 in your browser"
echo "4. Login with demo@example.com / password123"
echo ""
echo "📚 API Documentation: http://localhost:3001/api/docs"
echo "🗄️  Database Studio: npm run db:studio"

