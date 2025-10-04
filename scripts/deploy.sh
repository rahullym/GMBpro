#!/bin/bash

# GMB Optimizer Deployment Script for Render

echo "🚀 Starting deployment preparation..."

# Check if we're in the right directory
if [ ! -f "package.json" ]; then
    echo "❌ Error: Please run this script from the project root directory"
    exit 1
fi

# Build the project
echo "📦 Building the project..."
npm run build

if [ $? -ne 0 ]; then
    echo "❌ Build failed. Please fix the errors and try again."
    exit 1
fi

echo "✅ Build successful!"

# Check if git is clean
if [ -n "$(git status --porcelain)" ]; then
    echo "⚠️  Warning: You have uncommitted changes."
    echo "Please commit your changes before deploying:"
    echo "  git add ."
    echo "  git commit -m 'Prepare for deployment'"
    echo "  git push origin main"
else
    echo "✅ Git repository is clean"
fi

echo ""
echo "🎉 Ready for Render deployment!"
echo ""
echo "Next steps:"
echo "1. Push your code to GitHub:"
echo "   git push origin main"
echo ""
echo "2. Follow the deployment guide in RENDER_DEPLOYMENT.md"
echo ""
echo "3. Set up your services on Render:"
echo "   - PostgreSQL database"
echo "   - Redis cache"
echo "   - Backend web service"
echo "   - Frontend static site"
echo ""
echo "4. Configure environment variables as described in the guide"
