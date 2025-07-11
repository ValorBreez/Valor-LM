# Valor LM Cloud Deployment

## 🚀 Quick Deploy to Render.com

### Step 1: Push to GitHub
```bash
git add .
git commit -m "Add Valor LM web UI (clean version)"
git push origin main
```

### Step 2: Deploy to Render
1. Go to [render.com](https://render.com) and sign up
2. Click "New +" → "Web Service"
3. Connect your GitHub repository
4. Render will auto-detect the configuration from `render.yaml`
5. **IMPORTANT**: Before clicking "Create Web Service", add your environment variables:
   - Go to the "Environment" tab
   - Add these variables:
     - `SUPABASE_URL`: `https://zvrjedjllkaulswexqjc.supabase.co`
     - `SUPABASE_ANON_KEY`: Your actual Supabase anon key
     - `OPENAI_API_KEY`: Your actual OpenAI API key
6. Click "Create Web Service"
7. Wait 2-3 minutes for deployment

### Step 3: Share the URL
Once deployed, you'll get a URL like: `https://valor-lm.onrender.com`

Share this with Aron and anyone else!

## 🔒 Security Best Practices
- ✅ API keys are in `.env` file (not committed)
- ✅ `.env` is in `.gitignore`
- ✅ Git history cleaned of secrets
- ✅ Environment variables used in deployment

## 🧪 Test After Deployment
Test with this scenario:
> "I'm a project manager overseeing a cross-functional team. One of the key stakeholders, Karen from the finance department, is blocking our proposal to increase marketing spend..."

The AI should identify this as "The Desperate Seeker" and provide tactical advice. 