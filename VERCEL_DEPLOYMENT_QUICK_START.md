# FlipFlow - Vercel Deployment Quick Start

The absolute fastest way to get FlipFlow deployed to production.

## Prerequisites (5 minutes)

1. **Vercel Account**: Sign up at https://vercel.com (free)
2. **Anthropic API Key**: Get from https://console.anthropic.com
3. **GitHub Account**: For repository hosting

## Option 1: One-Click Deploy (Fastest - 10 minutes)

### Step 1: Fork or Clone

```bash
git clone https://github.com/yourusername/FlipFlow.git
cd FlipFlow
```

### Step 2: Install Vercel CLI

```bash
npm install -g vercel
vercel login
```

### Step 3: Deploy

```bash
# Deploy (will prompt for configuration)
vercel

# Add environment variable
vercel env add ANTHROPIC_API_KEY production
# Paste your API key when prompted

vercel env add NEXT_PUBLIC_APP_URL production
# Enter: https://flipflow.vercel.app (or your domain)

# Deploy to production
vercel --prod
```

Done! Your app is live.

## Option 2: Automated Script (15 minutes)

```bash
# Clone repository
git clone https://github.com/yourusername/FlipFlow.git
cd FlipFlow

# Install dependencies
npm install

# Set up local env
cp .env.example .env.local
# Edit .env.local with your ANTHROPIC_API_KEY

# Test locally
npm run dev
# Visit http://localhost:3000

# Deploy using automated script
./scripts/deploy.sh production
```

The script handles:
- Prerequisite checks
- Linting and type checking
- Production build testing
- Deployment to Vercel
- Health verification

## Option 3: GitHub Integration (20 minutes - Best for CI/CD)

### Step 1: Push to GitHub

```bash
git init
git add .
git commit -m "Initial commit"
gh repo create FlipFlow --private --source=.
git push -u origin main
```

### Step 2: Connect to Vercel

1. Go to https://vercel.com/new
2. Click "Import Project"
3. Select your GitHub repository
4. Click "Import"

### Step 3: Configure Environment Variables

In Vercel Dashboard:
1. Go to Settings → Environment Variables
2. Add:
   - `ANTHROPIC_API_KEY` = `sk-ant-xxx`
   - `NEXT_PUBLIC_APP_URL` = `https://flipflow.vercel.app`
3. Select all environments (Production, Preview, Development)
4. Click "Save"

### Step 4: Deploy

Click "Deploy" or push to main branch - Vercel auto-deploys!

## Verify Deployment

1. Visit your Vercel URL (e.g., `https://flipflow.vercel.app`)
2. Test the analyzer:
   - Click "Start Analyzing"
   - Use sample data
   - Verify results appear

## Optional: Set Up CI/CD (Additional 10 minutes)

### Add GitHub Secrets

Go to GitHub → Settings → Secrets → Actions:

```
VERCEL_TOKEN          - From https://vercel.com/account/tokens
ANTHROPIC_API_KEY     - Your Anthropic API key
NEXT_PUBLIC_APP_URL   - Your production URL
```

### Get Vercel IDs

```bash
vercel
cat .vercel/project.json
```

Add to GitHub Secrets:
```
VERCEL_ORG_ID         - From .vercel/project.json
VERCEL_PROJECT_ID     - From .vercel/project.json
```

Now every PR gets a preview deployment automatically!

## Troubleshooting

### Build Fails

```bash
# Test build locally first
npm run build

# Check environment variables
vercel env ls

# Redeploy with cache cleared
vercel --force --prod
```

### "Analysis failed" Error

1. Check Anthropic API key is set correctly
2. Verify API key has credits: https://console.anthropic.com
3. Check Vercel function logs: `vercel logs --follow`

### Need Help?

- Full documentation: See `DEPLOYMENT.md`
- GitHub Issues: Report bugs
- Vercel Support: https://vercel.com/support

## Next Steps

1. **Custom Domain** (optional):
   - Go to Vercel → Settings → Domains
   - Add your domain
   - Update DNS records

2. **Add Database** (for Scout features):
   - See `DEPLOYMENT.md` - Phase 2

3. **Set Up Monitoring**:
   - Enable Vercel Analytics (automatic for Pro)
   - Add Sentry: `npm install @sentry/nextjs`

4. **Enable Payments**:
   - Add Stripe keys to environment variables
   - See `.env.production.example`

## Cost Estimate

**Free Tier (Perfect for MVP):**
- Vercel: Free (Hobby plan)
- Anthropic: $5 free credit
- Total: $0/month

**Production (100 users):**
- Vercel Pro: $20/month
- Anthropic API: ~$50-100/month
- Total: ~$70-120/month

## Summary

You now have:
- ✅ Production deployment on Vercel
- ✅ HTTPS with automatic SSL
- ✅ Global CDN for fast loading
- ✅ Automatic deployments (if using GitHub)
- ✅ Environment variables configured
- ✅ Production-ready Next.js app

**Total Time**: 10-20 minutes

Ready to scale? See `DEPLOYMENT.md` for advanced features like database, automation, and payments.

Happy building!
