# Deployment Procedure — Formatura SaaS

**Version:** 1.0
**Last Updated:** 3 de Março, 2026
**Owner:** @devops (Gage)
**Status:** ⏳ Pre-Launch (Ready)

---

## 🚀 Overview

Standard procedure for deploying to production. Follow exactly — deviations cause production incidents.

**CRITICAL:** Only @devops can execute `git push` to `main` branch.

---

## Pre-Deployment Checklist (24 hours before)

- [ ] All acceptance criteria completed
- [ ] Code reviewed by @qa (gate decision: PASS)
- [ ] All tests passing (unit, integration, E2E)
- [ ] CodeRabbit scan: 0 CRITICAL issues, <3 HIGH
- [ ] Lint passing: `npm run lint`
- [ ] TypeScript check passing: `npm run typecheck`
- [ ] Build passing: `npm run build`
- [ ] Migration dry-run successful
- [ ] Backup of current database created
- [ ] Status page updated: "Scheduled maintenance"
- [ ] Team notified via Slack #deploys

---

## Phase 1: Final Validation (Staging Environment)

### 1.1 Run Pre-Deployment Tests

```bash
# From project root
npm run lint       # Must: PASS
npm run typecheck  # Must: PASS
npm test          # Must: All passing
npm run build     # Must: Success
```

**If any FAIL:**
- [ ] Stop deployment
- [ ] Fix issues
- [ ] Re-run until all PASS
- [ ] Document root cause

### 1.2 Run CodeRabbit Final Scan

```bash
# Frontend changes
wsl bash -c 'cd /mnt/c/.../formatura-saas && ~/.local/bin/coderabbit --prompt-only -t committed --base main'
```

**Acceptance:** 0 CRITICAL, <3 HIGH issues

**If CRITICAL found:**
- [ ] STOP deployment
- [ ] Fix immediately
- [ ] Re-scan until clear
- [ ] Document what was fixed

### 1.3 Test Database Migration

```bash
# Create snapshot before migration
supabase db push --dry-run

# Review output:
# - No data loss?
# - No table drops?
# - All indexes created?
```

**If dry-run fails:**
- [ ] Review migration SQL
- [ ] Fix syntax errors
- [ ] Re-test dry-run
- [ ] Get approval from @data-engineer

### 1.4 Verify Deployment Configuration

```bash
# Check Vercel settings
vercel env ls

# Check Railway settings
railway env ls

# Verify all required vars present:
# - NEXT_PUBLIC_API_URL ✓
# - NEXT_PUBLIC_SUPABASE_URL ✓
# - DATABASE_URL ✓
# - JWT_SECRET ✓
# - ASAAS_API_KEY ✓
# - WHATSAPP_API_TOKEN ✓
```

---

## Phase 2: Deploy to Production

### 2.1 Create Release Tag

```bash
# Determine version (semantic versioning)
git tag -l | sort -V | tail -1
# Current: v1.0.0
# Next: v1.1.0 (new features), v1.0.1 (bug fixes), v2.0.0 (breaking changes)

# Create tag
git tag -a v1.1.0 -m "feat: add proposal system [Story 1.1]"

# Verify
git tag -l | tail -5
```

### 2.2 Push to Main Branch

```bash
# Verify current branch
git branch

# Push changes
git push origin main

# Push tag
git push origin v1.1.0
```

**Auto-triggered deployments:**
- ✅ GitHub Actions (lint, typecheck, test, build, quality-summary)
- ✅ Vercel (Next.js frontend) → prod.formatura.com
- ✅ Railway (Express backend) → api.formatura.com
- ✅ Supabase (migrations) → Database

### 2.3 Monitor GitHub Actions

```
GitHub → formatura-saas → Actions → Workflows

Monitor: "pr-automation" (or current workflow)
├─ coderabbit-review ⏳
├─ lint ⏳
├─ typecheck ⏳
├─ test ⏳
├─ build ⏳
├─ quality-summary ⏳
└─ deploy-staging (runs on main)
```

**If any job FAILS:**
- [ ] Stop deployment immediately
- [ ] View job logs
- [ ] Identify error
- [ ] Revert with: `git revert {bad-commit-hash} && git push origin main`
- [ ] Document what went wrong
- [ ] Fix locally
- [ ] Retry deployment

### 2.4 Monitor Deployment Progress

**Total deployment time: ~15-20 minutes**

#### Vercel Deployment (Frontend)

```bash
vercel logs prod.formatura.com
# Wait for: "✓ Build completed"
# Wait for: "✓ Deployment ready"
```

Expected output:
```
✓ Build succeeded (2m 34s)
✓ 42 files unchanged, 5 changed
✓ Deployment ready [prod-xyz-123.vercel.app]
✓ Assigned to prod.formatura.com
```

**Check:** https://prod.formatura.com (should load)

#### Railway Deployment (Backend)

```bash
railway logs --follow
# Wait for: "✓ Build complete"
# Wait for: "Server running on port 3001"
```

Expected output:
```
▲ Build completed [completed]
✓ Docker image built [hash]
✓ Container started [id]
▲ Server running on port 3001
✓ Health check: OK
```

**Check:** https://api.formatura.com/health (should return 200)

#### Supabase Migrations

```bash
supabase migration list
# New migration should be "applied"

psql $DATABASE_URL -c "
  SELECT * FROM supabase_migrations_locks LIMIT 1;
"
# Should show latest migration applied
```

---

## Phase 3: Health Checks (30 minutes after deployment)

### 3.1 Uptime & Availability

```bash
# Frontend
curl -I https://prod.formatura.com
# Expected: HTTP/1.1 200 OK

# Backend
curl https://api.formatura.com/health
# Expected: {"status": "ok"}

# Database
psql $DATABASE_URL -c "SELECT 1;"
# Expected: 1
```

### 3.2 Critical User Journeys

**Test 1: Student Login**
1. Go to https://prod.formatura.com/login
2. Login with test student credentials
3. Should see dashboard
4. Should see payment schedule

**Test 2: Admin Creates Proposal**
1. Login as admin
2. Navigate to Proposals
3. Create new proposal
4. Should save successfully

**Test 3: Payment Processing**
1. Initiate payment
2. Check in Sentry/DataDog for errors
3. Verify payment status updated

**Test 4: Webhook Reception**
1. Trigger test webhook from ASAAS
2. Check backend logs (railway logs)
3. Verify transaction logged

### 3.3 Performance Metrics

```
Dashboard: DataDog → Production

Check:
├─ Request latency (p95) < 500ms
├─ Error rate < 1%
├─ Database query duration (p95) < 200ms
├─ Payment success rate > 99%
└─ API uptime > 99.9%
```

**If metrics anomalous:**
- [ ] Investigate in DataDog
- [ ] Check Sentry for errors
- [ ] If critical: execute ROLLBACK (Phase 4)

### 3.4 Error Monitoring

```
Sentry → Issues

Check for:
├─ New errors in last 30 min?
├─ Error rate increased?
├─ Payment-related errors?
└─ Database connection errors?
```

**If new CRITICAL errors:**
- [ ] Execute ROLLBACK immediately

---

## Phase 4: Rollback Procedure (If Needed)

### 4.1 When to Rollback

**STOP and rollback if:**
- [ ] CRITICAL errors in Sentry
- [ ] Database corruption detected
- [ ] Payment system broken (< 50% success rate)
- [ ] API completely unresponsive (>5s latency)

**Do NOT rollback for:**
- Minor performance issues (temporary)
- Minor UI glitches (can fix forward)
- Non-critical errors (can monitor and fix)

### 4.2 Execute Rollback

```bash
# Find previous good commit
git log --oneline | head -10
# Example: abc1234 feat: add proposal system
# Previous: def5678 fix: update auth flow

# Revert to previous version
git revert abc1234
git push origin main

# This triggers auto-deployment to previous version
# Monitor: GitHub Actions → deploy-staging job
# Time to rollback: ~15 minutes
```

### 4.3 Post-Rollback Actions

```bash
# Verify rollback successful
vercel logs prod.formatura.com
railway logs | tail -5

# Check health
curl https://api.formatura.com/health

# Notify team
# Slack: "🔄 Rolled back to previous version due to [reason]"

# Investigate root cause
# Create incident report
# Schedule hotfix
```

---

## Phase 5: Post-Deployment (1-24 hours)

### 5.1 Monitor for Issues (First hour)

```
Continue monitoring:
├─ Sentry error rate
├─ DataDog metrics
├─ User reports (Slack #support)
└─ Database performance
```

**If issues found:** Execute ROLLBACK immediately

### 5.2 Verify Features Working

Run through acceptance criteria from story:

**Story 1.1: Admin Creates Proposal**
- [ ] Admin can navigate to Proposals
- [ ] Can create new proposal
- [ ] Can add sections
- [ ] Sections display correctly
- [ ] Can save and view
- [ ] Can edit proposal
- [ ] Can delete section

If any fails: Create hotfix issue

### 5.3 Create Release Notes

**File:** `RELEASE-NOTES.md` (append)

```markdown
## v1.1.0 - 2026-03-03

### Features
- ✨ Admin can create reusable proposal templates (Story 1.1)
- ✨ Proposal template versioning

### Fixes
- 🐛 Fixed authentication timeout
- 🐛 Improved database query performance

### Performance
- ⚡ Reduced proposal page load time to 1.5s
- ⚡ Optimized database indexes

### Breaking Changes
- None

### Migration Notes
- Database schema updated: `00_add_proposals_table`
- No data migration required
- Backward compatible

### Deployment
- Duration: 18 minutes
- Rollback: Not needed
- Issues: None
```

### 5.4 Update Production Status

```bash
# Vercel
vercel env ls | grep DEPLOYMENT_STATUS
# Should show: "deployed@2026-03-03T14:30:00Z"

# DataDog
# Tag latest deployment: @deployment:v1.1.0

# Status Page
# Remove "Scheduled Maintenance" notice
# Post: "✅ v1.1.0 deployed successfully"
```

### 5.5 Notify Team

**Slack #deploys:**
```
✅ Deployment Successful: v1.1.0

📊 Metrics:
├─ Deployment time: 18 min
├─ Build size: 2.3MB (frontend)
├─ Database size: +150MB
├─ Performance: ✅ Baseline met
└─ Errors: ✅ 0 CRITICAL, 0 HIGH

👥 What's new:
├─ Admin proposal templates (Story 1.1)
├─ Improved auth timeout handling
└─ Database performance optimization

🔍 Monitoring: Active for next 24h
💬 Questions? See #engineering

Released by @devops (Gage)
```

---

## Emergency Deployment (Hotfix)

**For critical production bugs only.**

```bash
# 1. Create hotfix branch
git checkout -b hotfix/critical-payment-bug

# 2. Fix issue
[Make code changes]

# 3. Test locally
npm run lint && npm run typecheck && npm test

# 4. Commit
git commit -m "fix: critical payment calculation error [HOTFIX]"

# 5. Push to staging first
git push origin hotfix/critical-payment-bug
# Monitor Vercel preview deployment

# 6. If verified working:
git push origin main

# 7. Tag as patch version
git tag -a v1.0.1 -m "fix: critical payment bug"
git push origin v1.0.1

# 8. Monitor deployment (same as Phase 3)

# 9. Verify fix
[Manual testing]

# 10. Document in incident report
```

---

## Deployment Checklist Template

**File:** `docs/deployments/deploy-{date}-{version}.md`

```markdown
# Deployment: v1.1.0 - 2026-03-03

## Pre-Deployment
- [x] All tests passing
- [x] CodeRabbit: 0 CRITICAL, 0 HIGH
- [x] Database backup created
- [x] Status page updated
- [x] Team notified

## Deployment
- [x] Code pushed to main
- [x] GitHub Actions: All passing
- [x] Vercel: Deployed (18 min)
- [x] Railway: Deployed (12 min)
- [x] Supabase: Migrations applied

## Health Checks
- [x] Frontend loads: ✅
- [x] API responsive: ✅
- [x] Database accessible: ✅
- [x] Errors: < 1%
- [x] Performance: Baseline ✅

## Post-Deployment
- [x] Release notes created
- [x] Team notified
- [x] Monitoring activated
- [x] 24h review scheduled

**Deployed by:** @devops (Gage)
**Time:** ~30 minutes total
**Issues:** None
**Status:** ✅ SUCCESS
```

---

**Status:** ✅ Ready for Production

*Formatura SaaS — Deployment Procedure Complete*
