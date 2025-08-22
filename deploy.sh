#!/bin/bash

# OHW Mobile Application Deployment Script
# This script builds the frontend and deploys to GitHub Pages

echo "🚀 Starting OHW Mobile Application Deployment..."

# Check if we're in the right directory
if [ ! -f "package.json" ]; then
    echo "❌ Error: package.json not found. Please run this script from the project root."
    exit 1
fi

# Install dependencies
echo "📦 Installing dependencies..."
npm install
cd frontend && npm install && cd ..

# Build frontend
echo "🔨 Building frontend..."
cd frontend
npm run build
cd ..

# Check if build was successful
if [ ! -d "frontend/build" ]; then
    echo "❌ Error: Frontend build failed. Please check for errors."
    exit 1
fi

echo "✅ Frontend build completed successfully!"

# Git operations
echo "📝 Committing changes..."
git add .
git commit -m "Deploy: $(date '+%Y-%m-%d %H:%M:%S') - Auto deployment"

echo "🚀 Pushing to GitHub..."
git push origin main

echo "🎉 Deployment completed!"
echo "📱 Mobile URL: https://haryowl.github.io/ohw-enhance/"
echo "🔗 GitHub Repository: https://github.com/haryowl/ohw-enhance.git"
echo ""
echo "📋 Next steps:"
echo "1. Wait for GitHub Actions to complete (check Actions tab)"
echo "2. Visit https://haryowl.github.io/ohw-enhance/ to verify deployment"
echo "3. Test mobile installation on your device"
