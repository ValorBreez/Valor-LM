# Valor LM Cloud Deployment

## Quick Deploy to Render.com

### Step 1: Push to GitHub
```bash
git add .
git commit -m "Add Valor LM web UI (remove secrets)"
git push origin develop
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

## Alternative: Railway.app
1. Go to [railway.app](https://railway.app)
2. Connect GitHub repo
3. Add environment variables manually:
   - `SUPABASE_URL`
   - `SUPABASE_ANON_KEY`
   - `OPENAI_API_KEY`
4. Deploy automatically

## Environment Variables Needed
You'll need to add these in the deployment platform:

```env
SUPABASE_URL=https://zvrjedjllkaulswexqjc.supabase.co
SUPABASE_ANON_KEY=your-actual-anon-key-here
OPENAI_API_KEY=your-actual-openai-api-key-here
```

## Testing
After deployment, test with the Karen scenario:
> "I'm a project manager overseeing a cross-functional team. One of the key stakeholders, Karen from the finance department, is blocking our proposal to increase marketing spend..."

The AI should identify this as "The Desperate Seeker" and provide tactical advice. 