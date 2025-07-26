# Knitwear ERP - Cloud Deployment Guide

This guide will help you deploy your Knitwear ERP system to various cloud platforms.

## 🚀 Quick Deploy Options

### 1. Railway (Recommended - Easiest)

**Step 1: Prepare Your Repository**
```bash
# Make sure all files are committed to Git
git add .
git commit -m "Prepare for deployment"
git push origin main
```

**Step 2: Deploy to Railway**
1. Go to [railway.app](https://railway.app)
2. Sign up/Login with GitHub
3. Click "New Project" → "Deploy from GitHub repo"
4. Select your repository
5. Railway will automatically detect it's a Python app
6. Add environment variables:
   - `SECRET_KEY`: Generate a random secret key
   - `PORT`: Railway will set this automatically

**Step 3: Get Your URL**
- Railway will provide you with a URL like: `https://your-app-name.railway.app`

### 2. Render

**Step 1: Create Render Account**
1. Go to [render.com](https://render.com)
2. Sign up with GitHub

**Step 2: Deploy**
1. Click "New" → "Web Service"
2. Connect your GitHub repository
3. Configure:
   - **Name**: `knitwear-erp`
   - **Environment**: `Python 3`
   - **Build Command**: `pip install -r requirements.txt`
   - **Start Command**: `gunicorn --chdir backend app:app`
   - **Plan**: Free

**Step 3: Environment Variables**
Add these in Render dashboard:
- `SECRET_KEY`: Your secret key
- `PORT`: Render will set this

### 3. Heroku

**Step 1: Install Heroku CLI**
```bash
# Download from https://devcenter.heroku.com/articles/heroku-cli
```

**Step 2: Deploy**
```bash
# Login to Heroku
heroku login

# Create app
heroku create your-knitwear-erp

# Set environment variables
heroku config:set SECRET_KEY=your-secret-key-here

# Deploy
git push heroku main
```

## 🔧 Configuration

### Environment Variables

Set these in your cloud platform:

```bash
SECRET_KEY=your-super-secret-key-change-this
PORT=5000  # Most platforms set this automatically
```

### Frontend Configuration

After deploying the backend, update the frontend API URL:

1. Edit `frontend/app.js`
2. Change line 11:
```javascript
const API_BASE = 'https://your-backend-url.com/api';
```

3. Deploy frontend to a static hosting service (Netlify, Vercel, etc.)

## 📁 File Structure for Deployment

```
knitwearerp/
├── backend/
│   ├── app.py              # Production Flask app
│   ├── uploads/            # Image uploads folder
│   └── instance/           # Database folder
├── frontend/
│   ├── index.html
│   ├── app.js
│   └── styles.css
├── requirements.txt        # Python dependencies
├── Procfile               # Heroku deployment
├── runtime.txt            # Python version
└── README.md
```

## 🌐 Frontend Deployment

### Option 1: Netlify (Recommended)

1. Go to [netlify.com](https://netlify.com)
2. Drag and drop your `frontend` folder
3. Netlify will provide a URL
4. Update the API_BASE in `app.js` to point to your backend

### Option 2: Vercel

1. Go to [vercel.com](https://vercel.com)
2. Import your GitHub repository
3. Set root directory to `frontend`
4. Deploy

### Option 3: GitHub Pages

1. Push frontend files to a separate repository
2. Enable GitHub Pages in repository settings
3. Set source to main branch

## 🔒 Security Considerations

1. **Change Default Password**: After first deployment, change admin password
2. **Use HTTPS**: All cloud platforms provide SSL certificates
3. **Environment Variables**: Never commit secrets to Git
4. **Database**: Consider using PostgreSQL for production

## 📊 Database Options

### SQLite (Default)
- Good for small to medium applications
- File-based, no setup required
- Limited concurrent users

### PostgreSQL (Recommended for Production)
- Better performance and scalability
- Supports concurrent users
- Available on most cloud platforms

## 🚨 Troubleshooting

### Common Issues

1. **Port Issues**
   - Make sure your app uses `os.environ.get('PORT', 5000)`

2. **CORS Errors**
   - Update CORS origins in `backend/app.py`
   - Add your frontend domain to allowed origins

3. **Database Issues**
   - Ensure database directory is writable
   - Check file permissions

4. **Static Files**
   - Make sure `uploads` directory exists
   - Check file permissions

### Debug Commands

```bash
# Check if app is running
curl https://your-app-url.com/health

# Test API
curl https://your-app-url.com/api/test

# Check logs (platform specific)
heroku logs --tail
railway logs
```

## 📞 Support

If you encounter issues:

1. Check the platform's documentation
2. Review application logs
3. Test locally first
4. Ensure all environment variables are set

## 🎯 Next Steps

After successful deployment:

1. **Test all functionality**
2. **Change admin password**
3. **Add real data**
4. **Set up monitoring**
5. **Configure backups**

Your Knitwear ERP system will be accessible from anywhere in the world! 🌍 