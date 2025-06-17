#!/bin/bash

# Exit on error
set -e

echo "Building application..."

# Install dependencies
npm install

# Build client
echo "Building client..."
npm run build:client

# Build server
echo "Building server..."
npm run build:server

# Create production directory
echo "Creating production directory..."
mkdir -p production/public_html

# Copy necessary files
echo "Copying files..."
cp -r dist/public/* production/public_html/
cp client/public/.htaccess production/public_html/

# Create config file
echo "Creating config file..."
cat > production/public_html/config.js << EOL
window.ENV = {
  SUPABASE_URL: '${SUPABASE_URL}',
  SUPABASE_ANON_KEY: '${SUPABASE_ANON_KEY}'
};
EOL

# Create zip file
echo "Creating deployment package..."
cd production
zip -r ../pomodoro-timer.zip public_html
cd ..

echo "Deployment package created: pomodoro-timer.zip"
echo "Upload the contents of public_html to your Googie Host public_html directory" 