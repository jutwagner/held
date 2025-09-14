#!/bin/bash

# Setup script for environment variables
echo "Setting up environment variables for Azure Vision API..."

# Check if .env.local exists
if [ ! -f .env.local ]; then
    echo "Creating .env.local file..."
    touch .env.local
fi

# Add Azure Vision variables if they don't exist
if ! grep -q "AZURE_VISION_ENDPOINT" .env.local; then
    echo "" >> .env.local
    echo "# Azure Vision API Configuration" >> .env.local
    echo "AZURE_VISION_ENDPOINT=https://held-computervision.cognitiveservices.azure.com/" >> .env.local
    echo "AZURE_VISION_SUBSCRIPTION_KEY=your_azure_vision_subscription_key_here" >> .env.local
    echo "✅ Added Azure Vision environment variables template to .env.local"
    echo "⚠️  Please edit .env.local and replace 'your_azure_vision_subscription_key_here' with your actual Azure Vision subscription key"
else
    echo "✅ Azure Vision environment variables already exist in .env.local"
fi

echo "🎉 Environment setup complete!"
echo "📝 Note: .env.local is gitignored and won't be committed to version control"
echo "🔑 Don't forget to add your actual Azure Vision subscription key to .env.local"