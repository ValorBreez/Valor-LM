# Valor LM Cloud Deployment

## Quick Deploy to Render.com

### Step 1: Push to GitHub
```bash
git add .
git commit -m "Add Valor LM web UI"
git push origin main
```

### Step 2: Deploy to Render
1. Go to [render.com](https://render.com) and sign up
2. Click "New +" → "Web Service"
3. Connect your GitHub repository
4. Render will auto-detect the configuration from `render.yaml`
5. Click "Create Web Service"
6. Wait 2-3 minutes for deployment

### Step 3: Share the URL
Once deployed, you'll get a URL like: `https://valor-lm.onrender.com`

Share this with Aron and anyone else!

## Alternative: Railway.app
1. Go to [railway.app](https://railway.app)
2. Connect GitHub repo
3. Add environment variables manually
4. Deploy automatically

## Environment Variables
The `render.yaml` file already includes all necessary environment variables:
- SUPABASE_URL
- SUPABASE_ANON_KEY  
- OPENAI_API_KEY

## Testing
After deployment, test with the Karen scenario:
> "I'm a project manager overseeing a cross-functional team. One of the key stakeholders, Karen from the finance department, is blocking our proposal to increase marketing spend..."

The AI should identify this as "The Desperate Seeker" and provide tactical advice. 