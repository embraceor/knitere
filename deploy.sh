#!/bin/bash

echo "🚀 Knitwear ERP Deployment Script"
echo "=================================="

# Check if git is initialized
if [ ! -d ".git" ]; then
    echo "❌ Git repository not found. Initializing..."
    git init
    git add .
    git commit -m "Initial commit for deployment"
    echo "✅ Git repository initialized"
fi

# Generate secret key if not exists
if [ -z "$SECRET_KEY" ]; then
    echo "🔑 Generating secret key..."
    SECRET_KEY=$(python -c "import secrets; print(secrets.token_hex(32))")
    echo "SECRET_KEY=$SECRET_KEY" > .env
    echo "✅ Secret key generated and saved to .env"
fi

# Check if all required files exist
echo "📁 Checking required files..."
required_files=("requirements.txt" "Procfile" "runtime.txt" "backend/app.py")
for file in "${required_files[@]}"; do
    if [ -f "$file" ]; then
        echo "✅ $file exists"
    else
        echo "❌ $file missing"
        exit 1
    fi
done

echo ""
echo "🎯 Deployment Options:"
echo "1. Railway (Recommended)"
echo "2. Render"
echo "3. Heroku"
echo "4. Manual deployment"
echo ""

read -p "Choose deployment option (1-4): " choice

case $choice in
    1)
        echo "🚂 Deploying to Railway..."
        echo "1. Go to https://railway.app"
        echo "2. Sign up/Login with GitHub"
        echo "3. Click 'New Project' → 'Deploy from GitHub repo'"
        echo "4. Select this repository"
        echo "5. Add environment variable: SECRET_KEY=$SECRET_KEY"
        echo "6. Railway will automatically deploy your app"
        ;;
    2)
        echo "🎨 Deploying to Render..."
        echo "1. Go to https://render.com"
        echo "2. Sign up with GitHub"
        echo "3. Click 'New' → 'Web Service'"
        echo "4. Connect this repository"
        echo "5. Configure:"
        echo "   - Name: knitwear-erp"
        echo "   - Environment: Python 3"
        echo "   - Build Command: pip install -r requirements.txt"
        echo "   - Start Command: gunicorn --chdir backend app:app"
        echo "6. Add environment variable: SECRET_KEY=$SECRET_KEY"
        ;;
    3)
        echo "🦸 Deploying to Heroku..."
        if ! command -v heroku &> /dev/null; then
            echo "❌ Heroku CLI not installed. Please install from:"
            echo "https://devcenter.heroku.com/articles/heroku-cli"
            exit 1
        fi
        
        echo "1. Login to Heroku..."
        heroku login
        
        echo "2. Creating Heroku app..."
        heroku create knitwear-erp-$(date +%s)
        
        echo "3. Setting environment variables..."
        heroku config:set SECRET_KEY=$SECRET_KEY
        
        echo "4. Deploying..."
        git push heroku main
        
        echo "✅ Deployment complete!"
        echo "Your app URL: $(heroku info -s | grep web_url | cut -d= -f2)"
        ;;
    4)
        echo "📋 Manual Deployment Instructions:"
        echo ""
        echo "1. Push your code to GitHub:"
        echo "   git add ."
        echo "   git commit -m 'Prepare for deployment'"
        echo "   git push origin main"
        echo ""
        echo "2. Choose a cloud platform:"
        echo "   - Railway: https://railway.app"
        echo "   - Render: https://render.com"
        echo "   - Heroku: https://heroku.com"
        echo "   - DigitalOcean: https://digitalocean.com"
        echo ""
        echo "3. Set environment variables:"
        echo "   SECRET_KEY=$SECRET_KEY"
        echo ""
        echo "4. Deploy frontend separately:"
        echo "   - Netlify: https://netlify.com"
        echo "   - Vercel: https://vercel.com"
        echo "   - GitHub Pages"
        ;;
    *)
        echo "❌ Invalid option"
        exit 1
        ;;
esac

echo ""
echo "🎉 Deployment setup complete!"
echo ""
echo "📝 Next steps:"
echo "1. Deploy your backend using the instructions above"
echo "2. Update frontend/app.js with your backend URL"
echo "3. Deploy frontend to a static hosting service"
echo "4. Test your application"
echo "5. Change the default admin password"
echo ""
echo "📚 For detailed instructions, see DEPLOYMENT.md" 