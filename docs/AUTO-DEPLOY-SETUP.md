# Auto-Deploy Configuration — Formatura SaaS

**Date:** 3 de Março, 2026
**Configured by:** Gage (DevOps)
**Status:** Ready for Setup

---

## Architecture

```
┌─────────────────────────────────────────┐
│       GitHub (Repository)               │
│       ├─ main branch                    │
│       └─ PR → Merge → Trigger deploy   │
└──────────────┬──────────────────────────┘
               │
        ┌──────▼──────────────────┐
        │  GitHub Actions (CI/CD) │
        │  All checks pass ✅     │
        └──────┬──────────────────┘
               │
      ┌────────┴────────┐
      │                 │
  ┌───▼────┐       ┌───▼────┐
  │ Vercel │       │ Railway │
  │ (Next) │       │(Express)│
  └────────┘       └────────┘
      │                 │
  prod.formatura.com  api.formatura.com
      ↓                 ↓
  ┌──────────────────────────────┐
  │    Supabase (Database)       │
  │    ├─ Production DB          │
  │    ├─ Backups (7 days)       │
  │    └─ Monitoring             │
  └──────────────────────────────┘
```

---

## 1. Vercel Setup (Next.js Frontend)

### Step 1: Connect Repository

```bash
# Login to Vercel
vercel login

# Link project
cd formatura-saas
vercel link
```

**Interactive prompts:**
```
? Set up and deploy "formatura-saas"? (Y/n) → Y
? Which scope do you want to deploy to? → your-team
? Link to existing project? → N
? Project name: → formatura-saas
? Framework Preset: → Next.js
? Root directory: → packages/web (or ./src if monorepo)
? Build Command: → npm run build
? Output Directory: → .next
? Install Command: → npm install
```

### Step 2: Environment Variables

**File:** `.vercel/env.json`

```json
{
  "production": {
    "NEXT_PUBLIC_API_URL": "https://api.formatura.com",
    "NEXT_PUBLIC_SUPABASE_URL": "https://xxxxx.supabase.co",
    "NEXT_PUBLIC_SUPABASE_ANON_KEY": "eyJxxxx..."
  },
  "preview": {
    "NEXT_PUBLIC_API_URL": "https://staging-api.formatura.com",
    "NEXT_PUBLIC_SUPABASE_URL": "https://xxxxx.supabase.co",
    "NEXT_PUBLIC_SUPABASE_ANON_KEY": "eyJxxxx..."
  }
}
```

### Step 3: Deployment Configuration

**File:** `vercel.json`

```json
{
  "buildCommand": "npm run build",
  "outputDirectory": ".next",
  "installCommand": "npm install",
  "env": {
    "NEXT_PUBLIC_API_URL": "@next_public_api_url",
    "NEXT_PUBLIC_SUPABASE_URL": "@next_public_supabase_url",
    "NEXT_PUBLIC_SUPABASE_ANON_KEY": "@next_public_supabase_anon_key"
  },
  "git": {
    "deploymentEnabled": {
      "main": true,
      "develop": true
    }
  },
  "regions": ["sfo1"],
  "functions": {
    "api/**/*.ts": {
      "memory": 1024,
      "maxDuration": 60
    }
  }
}
```

### Step 4: GitHub Integration (Automatic)

Vercel automatically:
- ✅ Watches GitHub repository
- ✅ Deploys on push to `main`
- ✅ Creates preview deployments on PRs
- ✅ Comments deployment URLs on PRs

### Step 5: Auto-Deploy Configuration

```bash
# Via Vercel CLI
vercel env add NEXT_PUBLIC_API_URL https://api.formatura.com

# Or via web: vercel.com → Project Settings → Environment Variables
```

**Auto-deploy triggers:**
```
Push to main → GitHub Actions passes → Vercel auto-deploys to prod
Push to develop → GitHub Actions passes → Vercel auto-deploys to staging
Create PR → Vercel creates preview environment
```

---

## 2. Railway Setup (Express Backend)

### Step 1: Connect Repository

```bash
# Install Railway CLI
npm install -g @railway/cli

# Login to Railway
railway login

# Create new project
railway init
```

**Interactive prompts:**
```
? Project name: → formatura-saas-api
? Select environment: → production
? Select a template: → Node.js Express
```

### Step 2: Railway Configuration

**File:** `railway.toml`

```toml
[build]
builder = "nix"
dockerfile = "./Dockerfile"

[deploy]
startCommand = "npm start"
healthcheckPath = "/health"
healthcheckInterval = 10
restartPolicyMaxRetries = 5

[[services]]
name = "api"
buildCommand = "npm install && npm run build"
startCommand = "npm start"
port = 3001

[[services]]
name = "postgres"
type = "postgresql"
```

### Step 3: Dockerfile

**File:** `Dockerfile`

```dockerfile
# Build stage
FROM node:18-alpine AS builder
WORKDIR /app

# Install dependencies
COPY package*.json ./
RUN npm ci --only=production

# Copy source
COPY . .
RUN npm run build

# Runtime stage
FROM node:18-alpine
WORKDIR /app

ENV NODE_ENV=production
ENV PORT=3001

# Copy from builder
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/package*.json ./

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD node -e "require('http').get('http://localhost:3001/health', (r) => {if (r.statusCode !== 200) throw new Error(r.statusCode)})"

EXPOSE 3001

CMD ["npm", "start"]
```

### Step 4: Environment Variables

**Railway UI:** Project → Variables → Add

```
DATABASE_URL=postgresql://user:pass@host/db
JWT_SECRET=your-secret-here
ASAAS_API_KEY=your-key-here
WHATSAPP_API_TOKEN=your-token-here
NODE_ENV=production
```

### Step 5: Auto-Deploy Configuration

```bash
# Link GitHub repo to Railway
railway link

# Enable auto-deploy
railway env production
# Set: RAILWAY_GITHUB_AUTO_DEPLOY=true
```

**Auto-deploy triggers:**
```
Push to main → GitHub webhook → Railway rebuilds and deploys
Push to feature branch → Railway creates preview environment
PR created → Railway creates staging deployment
```

---

## 3. Health Checks & Monitoring

### Frontend (Vercel)

Vercel automatically monitors:
- ✅ Build success/failure
- ✅ Deployment status
- ✅ Response times
- ✅ Error rates

Dashboard: `vercel.com → Project → Analytics`

### Backend (Railway)

Railway automatically monitors:
- ✅ Container health
- ✅ CPU/Memory usage
- ✅ Build logs
- ✅ Restart events

Dashboard: `railway.app → Project → Analytics`

### Database (Supabase)

Supabase automatically monitors:
- ✅ Query performance
- ✅ Connection pool status
- ✅ Backup status
- ✅ Storage usage

Dashboard: `supabase.com → Project → Analytics`

---

## 4. Rollback Strategy

### If Deploy Fails

**Automatic:**
```
Deploy fails → Previous version stays live
No traffic disruption → Team gets alerted
```

**Manual Rollback (if needed):**

```bash
# Vercel
vercel rollback [deployment-url]

# Railway
railway redeploy [previous-deployment-id]
```

### If Deploy Succeeds but Has Bugs

**Immediate Action:**
1. Revert commit in GitHub
2. GitHub Actions triggers new deploy
3. Previous stable version live again

```bash
git revert {bad-commit-hash}
git push origin main
# Auto-deploy to previous version
```

---

## 5. Pipeline Overview

### Full Deployment Workflow

```
1. Developer commits to feature branch
   ↓
2. Push to GitHub
   ↓
3. GitHub Actions runs (5-10 min):
   ├─ CodeRabbit (security)
   ├─ Lint checks
   ├─ TypeScript compile
   ├─ Unit tests
   ├─ Build verification
   └─ Quality summary
   ↓
4. If all pass:
   ├─ Vercel creates preview deployment
   ├─ Railway creates staging deployment
   └─ Both get tested
   ↓
5. Developer creates Pull Request
   ↓
6. Reviewer approves PR
   ↓
7. Auto-merge triggered
   ↓
8. Merge to main branch
   ↓
9. Auto-deploy to production:
   ├─ Vercel deploys Next.js → prod.formatura.com
   ├─ Railway deploys Express → api.formatura.com
   └─ Supabase already in sync
   ↓
10. Health checks verify (30s)
   ↓
11. Slack notification: "Deploy successful"
   ↓
12. Teams monitor metrics for issues

Total time: ~15-20 minutes from commit to production
```

---

## 6. Setup Checklist

### Vercel Setup
- [ ] Create Vercel account
- [ ] Connect GitHub repository
- [ ] Set environment variables
- [ ] Configure vercel.json
- [ ] Test preview deployment on PR
- [ ] Test production deployment
- [ ] Configure domain (prod.formatura.com)
- [ ] Enable auto-deploy

### Railway Setup
- [ ] Create Railway account
- [ ] Create project
- [ ] Connect GitHub repository
- [ ] Create Dockerfile
- [ ] Configure railway.toml
- [ ] Set environment variables
- [ ] Add PostgreSQL service (or use Supabase)
- [ ] Enable auto-deploy
- [ ] Configure domain (api.formatura.com)

### GitHub Actions Integration
- [ ] `.github/workflows/pr-automation.yml` created ✅
- [ ] CodeRabbit configured ✅
- [ ] Branch protection rules enabled
- [ ] Vercel GitHub integration active
- [ ] Railway GitHub integration active

### Testing
- [ ] Test PR preview (Vercel)
- [ ] Test PR preview (Railway)
- [ ] Test merge to main (prod deploy)
- [ ] Test rollback procedure
- [ ] Monitor health checks

---

## 7. Monitoring Deployment

### Real-Time Dashboard

Create dashboard showing:
```
Frontend (Vercel)
├─ Latest deployment: 2 hours ago
├─ Status: ✅ Live
├─ URL: https://prod.formatura.com
└─ Performance: 95ms avg response

Backend (Railway)
├─ Latest deployment: 2 hours ago
├─ Status: ✅ Live
├─ URL: https://api.formatura.com
├─ CPU: 12% | Memory: 256MB/512MB
└─ Uptime: 99.95%

Database (Supabase)
├─ Status: ✅ Healthy
├─ Connections: 15/100
├─ Storage: 2.3GB/5GB
└─ Backup: 2 hours ago
```

### Slack Notifications

Configure GitHub Actions to post:
```
✅ Deploy successful: prod.formatura.com
│  Deployed by: @dev
│  Commit: feat: add payment system
│  Time: 2 min
│  Performance: 95ms
└─ Rollback: gh pr revert {pr-number}
```

---

## 8. Costs Estimation

| Service | Tier | Cost | Usage |
|---------|------|------|-------|
| **Vercel** | Pro | $20/mo | Frontend + edge functions |
| **Railway** | Pay-as-you-go | $5-50/mo | 1 small dyno |
| **Supabase** | Pro | $25/mo | 8GB storage, backups |
| **Total** | - | **~$50-95/mo** | MVP production |

Can scale down to free tier during development.

---

## Status: Configuration Complete

**What's documented:**
- ✅ Vercel (Next.js) setup
- ✅ Railway (Express) setup
- ✅ Health checks
- ✅ Rollback strategy
- ✅ Full deployment workflow
- ✅ Monitoring setup

**Next steps:**
1. Create Vercel account
2. Create Railway account
3. Connect GitHub repositories
4. Set environment variables
5. Deploy preview (test)
6. Deploy production (test)
7. Monitor metrics

---

**Status:** ✅ Ready for Implementation

Gage (DevOps) — 3 de Março, 2026

*Formatura SaaS — Auto-Deploy Setup Complete*
