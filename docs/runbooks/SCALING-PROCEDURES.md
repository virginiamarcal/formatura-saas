# Scaling Procedures — Formatura SaaS

**Version:** 1.0
**Last Updated:** 3 de Março, 2026
**Owner:** @devops (Gage) + @architect (Aria)
**Status:** ⏳ Pre-Launch (Ready)

---

## 🚀 Overview

Procedures for scaling system components when approaching resource limits. Scaling should be proactive (before issues) not reactive (after outage).

**Monitoring Targets:**
- CPU: Alert at 70%, scale at 80%
- Memory: Alert at 70%, scale at 85%
- Database connections: Alert at 70%, scale at 80%
- Response time (p95): Alert at 500ms, investigate at 1s

---

## 1. Frontend Scaling (Vercel - Next.js)

### 1.1 Monitoring Metrics

**Dashboard:** Vercel Analytics

```
Check every hour:
├─ Response time (p95): Target < 200ms
├─ Time to first byte (TTFB): Target < 100ms
├─ Core Web Vitals: Target good
└─ Edge function duration: Target < 500ms
```

### 1.2 When to Scale

**Scale UP if:**
- Response time (p95) > 500ms consistently
- TTFB > 200ms
- Edge functions timeout (>60s)
- Concurrent users > 5,000

**Don't scale if:**
- Issue is database (scale database instead)
- Issue is network/CDN (contact Vercel support)
- Issue is bad code (optimize first)

### 1.3 Scaling Actions

**Option 1: Enable Vercel Pro Features** (Recommended)

```bash
# Upgrade Vercel plan (if needed)
vercel upgrade

# Enable:
# - Edge Functions (faster compute)
# - Incremental Static Regeneration (ISR)
# - Advanced Caching
```

**Option 2: Code Optimization**

```bash
# Analyze bundle size
npm run analyze  # or next/bundle-analyzer

# Optimize:
├─ Code splitting: Next.js does automatic
├─ Image optimization: Use <Image> component
├─ CSS: Trim unused styles
└─ JavaScript: Tree-shake dead code
```

**Example: Optimize images**
```tsx
// ❌ Bad
<img src="/logo.png" width={200} height={100} />

// ✅ Good
import Image from 'next/image'
<Image
  src="/logo.png"
  width={200}
  height={100}
  priority={false}
  placeholder="blur"
/>
```

**Option 3: Add CDN Layer**

```bash
# If Vercel built-in CDN insufficient:
# - Enable Cloudflare (free tier)
# - Cache static assets
# - Enable compression
```

### 1.4 Verification

```bash
# After scaling changes:
vercel logs prod.formatura.com

# Verify:
├─ No new errors
├─ Response time improved
└─ Build size reasonable
```

---

## 2. Backend Scaling (Railway - Express)

### 2.1 Monitoring Metrics

**Dashboard:** Railway + DataDog

```
Check every hour:
├─ CPU usage: Target < 60%
├─ Memory usage: Target < 70%
├─ Request latency (p95): Target < 200ms
├─ Error rate: Target < 0.1%
└─ Requests/sec: Current capacity?
```

### 2.2 Vertical Scaling (Increase dyno size)

**When to scale UP:**
- CPU > 80% consistently (5+ minutes)
- Memory > 85% consistently
- Response time (p95) > 1s

**Scale UP:**

```bash
# View current configuration
railway env list | grep RAILWAY_SCALE

# Increase memory/CPU
railway env set RAILWAY_SCALE_TYPE="performance"

# Or manually resize
railway logs --follow  # Verify restart
```

**Railway dyno sizes:**
```
STARTER (default): 512MB RAM, 0.5 CPU
  - Good for: Development, <100 req/s

PRO: 1GB RAM, 1 CPU
  - Good for: Production MVP, 100-500 req/s
  - Cost: ~$15/month

PERFORMANCE: 2GB RAM, 2 CPU
  - Good for: High traffic, 500-2000 req/s
  - Cost: ~$50/month

BUSINESS: 4GB+ RAM, 4 CPU
  - Good for: Enterprise, >2000 req/s
```

### 2.3 Horizontal Scaling (Multiple instances)

**When to use:**
- Load distributed across multiple requests
- CPU/memory spikes due to traffic (not code)
- Need redundancy for reliability

**Scale OUT (multiple instances):**

```bash
# Railway doesn't auto-scale like Heroku
# Options:

# Option A: Use load balancer
# - Frontend cloud provider (Vercel) routes to multiple backends
# - Configure multiple Railway services

# Option B: Code optimization (Recommended first)
# - Optimize slow queries
# - Cache frequently accessed data
# - Use connection pooling
```

**Example: Connection Pooling**

```typescript
// ✅ Good: Reuse connections
import { Pool } from 'pg'

const pool = new Pool({
  max: 20,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 2000,
})

app.get('/api/payments', async (req, res) => {
  const client = await pool.connect()
  try {
    const result = await client.query('SELECT ...')
    res.json(result.rows)
  } finally {
    client.release()
  }
})
```

### 2.4 Verification

```bash
# After scaling:
railway logs --follow

# Verify:
├─ CPU/memory improved
├─ Response time improved
├─ No new errors
└─ Deployment successful
```

---

## 3. Database Scaling (Supabase - PostgreSQL)

### 3.1 Monitoring Metrics

**Dashboard:** Supabase Analytics

```
Check every day:
├─ Connections active: Target < 70% of pool
├─ Query time (p95): Target < 200ms
├─ Slow queries (>1s): Target 0
├─ Storage usage: Target < 80% of quota
└─ Replication lag: Target < 100ms
```

### 3.2 Connection Pool Scaling

**When to scale:**
- Active connections > 70% of pool size
- Connection timeout errors
- New connections rejected

**Scale UP (increase pool size):**

```bash
# Supabase default: 20 connections
# Increase to 30-50 for high traffic

# Via Supabase dashboard:
# Settings → Database → Connection Pooling → Max Connections
```

**Or use PgBouncer:**

```bash
# Already configured in Supabase
# Pooler mode: transaction (default, good for most)
# Cost: Included in Pro plan
```

### 3.3 Storage Scaling

**When to scale:**
- Storage > 80% of quota
- Approaching limits in 2-3 weeks

**Scale UP (increase storage):**

```bash
# Supabase dashboard:
# Settings → Billing → Storage
# Upgrade from 8GB to 50GB

# Cost: Pro plan includes 8GB, $4 per additional 2GB
```

**Or optimize existing storage:**

```bash
# Remove old data
DELETE FROM audit_log WHERE created_at < NOW() - interval '90 days';

# Archive old payments
CREATE TABLE payments_archive AS
SELECT * FROM payments WHERE created_at < '2025-01-01';
DELETE FROM payments WHERE created_at < '2025-01-01';

# Vacuum to reclaim space
VACUUM ANALYZE payments;
```

### 3.4 Query Optimization (Before scaling)

**Always optimize queries first before scaling database:**

```bash
# Find slow queries
psql $DATABASE_URL -c "
  SELECT
    query,
    count(*),
    mean_exec_time,
    max_exec_time
  FROM pg_stat_statements
  WHERE mean_exec_time > 100
  ORDER BY mean_exec_time DESC
  LIMIT 10;
"

# Explain slow query
EXPLAIN ANALYZE SELECT * FROM payments
WHERE student_id = 123 AND status = 'pending';

# Add index if missing
CREATE INDEX idx_payments_student_status
ON payments(student_id, status);
```

### 3.5 Verification

```bash
# After scaling:
psql $DATABASE_URL -c "
  SELECT datname, usename, count(*)
  FROM pg_stat_activity
  GROUP BY datname, usename;
"

# Verify:
├─ Connections still < 80% of pool
├─ No connection timeouts
├─ Query times improved
└─ Storage sufficient for growth
```

---

## 4. Combined Scaling Scenario

**Example: System traffic grows 10x**

### Timeline

**Week 1 (Alert Phase):**
```
Monday 9am: Monitoring shows spike
├─ Frontend response time: 500ms (was 100ms)
├─ Backend CPU: 75% (was 20%)
└─ Database queries: 300ms (was 50ms)

Action: Investigation
├─ Is this spike normal or attack?
├─ Which component is bottleneck?
└─ Database? Backend? Frontend?
```

**Week 1 (Scaling Phase):**
```
Monday 3pm: Identify bottleneck = Backend API
├─ Database doing fine (CPU 40%)
├─ Frontend doing fine (response time 150ms)
└─ Backend maxed out (CPU 95%)

Action: Scale backend
├─ Increase Railway dyno from STARTER → PRO
├─ Optimize slow endpoints
└─ Monitor
```

**Week 2 (Expansion Phase):**
```
Tuesday 11am: Traffic still growing
├─ Backend now fine (CPU 60%)
├─ Frontend still fine
└─ Database CPU: 70% (was 40%)

Action: Optimize database
├─ Find slow queries
├─ Add missing indexes
├─ Increase connection pool (if needed)
└─ Monitor
```

**Week 2 (Stabilization Phase):**
```
Friday 5pm: System stable at 10x traffic
├─ All components < 80% capacity
├─ Response times: < 200ms
├─ Uptime: 99.95%

Action: Document what worked
├─ Update runbooks
├─ Capacity planning for next scale
└─ Archive metrics
```

---

## 5. Capacity Planning

### 5.1 Current Capacity

**As of MVP launch (Week 8):**

| Component | Current Capacity | Alert Threshold |
|-----------|-----------------|-----------------|
| **Frontend (Vercel)** | ~5,000 concurrent users | 70% = 3,500 |
| **Backend (Railway)** | ~1,000 req/s | 70% = 700 req/s |
| **Database (Supabase)** | 8GB storage, 20 connections | Storage: 6.4GB, Conn: 14 |
| **ASAAS Integration** | ~500 payments/min | 350 payments/min |

### 5.2 Growth Projection

**Assuming 20% weekly growth:**

| Week | Users | Req/sec | Storage | Action |
|------|-------|---------|---------|--------|
| W8 (Launch) | 1,000 | 50 | 1GB | Monitor |
| W10 | 1,500 | 75 | 1.2GB | Monitor |
| W12 | 2,100 | 110 | 1.5GB | ⚠️ Alert |
| W14 | 3,000 | 160 | 1.8GB | 🔴 Scale backend |
| W16 | 4,300 | 230 | 2.3GB | 🔴 Scale database |

### 5.3 Pre-Emptive Scaling Plan

**Week 10 (before bottleneck):**
```bash
# Increase Railway from STARTER to PRO
# Cost: ~$15/mo increase
# Benefit: 2x capacity

# Increase Supabase connections 20 → 30
# Cost: Included in Pro plan
# Benefit: Better connection management
```

**Week 12 (as load increases):**
```bash
# Monitor database query performance
# Add strategic indexes
# Optimize slow endpoints

# Prepare horizontal scaling plan
# Consider: Multiple API instances? Caching layer?
```

---

## 6. Scaling Decision Tree

```
User reports slowness OR Monitoring alerts:
│
├─ Yes → Check current metrics (CPU, memory, latency)
│
├─ CPU/Memory high (>80%)?
│   ├─ Yes → VERTICAL SCALE (increase dyno size)
│   └─ No → Continue
│
├─ Database response time high (>500ms)?
│   ├─ Yes → Optimize queries / Add indexes
│   └─ No → Continue
│
├─ API response time high (>1s)?
│   ├─ Yes → Check for slowest endpoints
│   │   ├─ Payment operations → Async processing
│   │   ├─ List operations → Add pagination/caching
│   │   └─ Other → Optimize code
│   └─ No → Continue
│
├─ Frontend response slow?
│   ├─ Yes → Bundle optimization / CDN
│   └─ No → Continue
│
└─ All metrics normal?
    └─ May be network/external factor
        ├─ Check ASAAS status
        ├─ Check Vercel status
        └─ Check Supabase status
```

---

## 7. Post-Scaling Actions

### 7.1 Verify Improvement

```bash
# 1. Metrics should improve
DataDog: Response time, error rate, CPU/memory

# 2. User reports should decrease
Slack #support: "Everything fast again!"

# 3. No new issues introduced
Sentry: No new errors
```

### 7.2 Document Changes

**File:** `docs/scaling/scale-{date}-{component}.md`

```markdown
# Scaling Action: Backend - 2026-03-15

**Decision:** Increase Railway dyno from STARTER to PRO
**Trigger:** CPU consistently > 80%
**Expected Impact:** 2x request throughput

## Before
- CPU: 85%
- Memory: 720MB / 512MB (OVERRUN)
- Response time (p95): 1200ms
- Error rate: 0.5%

## After
- CPU: 40%
- Memory: 400MB / 1024MB
- Response time (p95): 150ms
- Error rate: 0.02%

## Cost Impact
- Before: $0 (starter included)
- After: +$15/mo for PRO dyno
- ROI: Prevents outages, enables growth

## Monitoring
- Dashboard: [DataDog link]
- Duration: 24h intensive, 1 week baseline
- Decision: Keep (if metrics stay good)
```

### 7.3 Update Runbook

Incorporate learnings back into this document:
- [ ] Update capacity projections
- [ ] Add new scaling triggers
- [ ] Document what worked/didn't

---

## Emergency Scaling (Last Resort)

**Only if system becoming unavailable:**

```bash
# 1. Disable non-critical features (temporarily)
feature_flags: {
  "enable_reporting": false,  # Disable heavy reports
  "enable_webhooks": false,   # Disable webhook retries
}

# 2. Scale to maximum capacity
railway env set RAILWAY_SCALE_TYPE="business"
vercel upgrade to enterprise tier

# 3. Shed load
# Redirect non-essential traffic
# Notify users of degraded service

# 4. Fix root cause in background
# Add indexes, optimize queries, refactor code

# 5. Re-enable features gradually
feature_flags: {
  "enable_reporting": true,
  "enable_webhooks": true,
}
```

---

## Monitoring Checklist (Daily)

**Every morning (9am):**
- [ ] Check DataDog dashboard for overnight metrics
- [ ] CPU/Memory < 70%?
- [ ] Response time < 500ms?
- [ ] Error rate < 1%?
- [ ] Database query time < 200ms?

**Weekly (Friday):**
- [ ] Review growth trends
- [ ] Project capacity for next 2 weeks
- [ ] Plan scaling before bottleneck
- [ ] Update capacity planning table

---

**Status:** ✅ Ready for Production

*Formatura SaaS — Scaling Procedures Complete*
