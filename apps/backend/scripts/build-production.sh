#!/bin/bash

# Memory-optimized build script for Render deployment

echo "🚀 Starting memory-optimized build..."

# Set Node.js memory limit
export NODE_OPTIONS="--max-old-space-size=512"

# Clean previous build
echo "🧹 Cleaning previous build..."
rm -rf dist/

# Install dependencies with memory optimization
echo "📦 Installing dependencies..."
npm ci --production=false --prefer-offline --no-audit

# Build with memory optimization
echo "🔨 Building application..."
npm run build

if [ $? -eq 0 ]; then
    echo "✅ Build successful!"
else
    echo "❌ Build failed!"
    exit 1
fi

# Clean up dev dependencies to save space
echo "🧹 Cleaning up dev dependencies..."
npm prune --production

echo "🎉 Build complete and optimized for production!"
