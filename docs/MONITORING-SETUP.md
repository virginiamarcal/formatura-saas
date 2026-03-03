# Monitoring & Observability Setup — Formatura SaaS

**Date:** 3 de Março, 2026
**Configured by:** Gage (DevOps)
**Status:** Ready for Setup

---

## Overview

Monitoring = Visibility into production system health.

Without monitoring:
- ❌ Don't know if system is down
- ❌ Don't know why errors happen
- ❌ Can't debug production issues
- ❌ Performance problems undetected

With monitoring:
- ✅ Real-time alerts on issues
- ✅ Root cause analysis
- ✅ Performance trending
- ✅ User impact tracking

---

## Architecture

```
┌─────────────────────────────────────────┐
│     Formatura SaaS (Production)         │
│  ├─ Frontend (Vercel)                   │
│  ├─ Backend (Railway/Express)           │
│  └─ Database (Supabase/PostgreSQL)      │
└────────┬────────────────────────────────┘
         │ Errors, Metrics, Logs
    ┌────┴──────────────────────────┐
    │                               │
┌───▼────┐                    ┌────▼────┐
│ Sentry │                    │ DataDog │
│(Errors)│                    │(Metrics)│
└────────┘                    └────────┘
    │                              │
    └──────────┬──────────────────┘
               │
         ┌─────▼──────┐
         │   Slack    │
         │  Alerts    │
         └────────────┘
```

---

## 1. Sentry Setup (Error Tracking)

### Step 1: Create Sentry Account

```bash
# Visit sentry.io → Sign up
# Create organization: Formatura SaaS
# Create project: formatura-saas-backend
# Select platform: Node.js
```

### Step 2: Backend Integration

**File:** `packages/backend/src/sentry.ts`

```typescript
import * as Sentry from '@sentry/node';
import * as Tracing from '@sentry/tracing';
import express from 'express';

export function initSentry(app: express.Application) {
  // Initialize Sentry
  Sentry.init({
    dsn: process.env.SENTRY_DSN,
    environment: process.env.NODE_ENV || 'development',
    tracesSampleRate: 1.0,
    integrations: [
      new Sentry.Integrations.Http({ tracing: true }),
      new Tracing.Express.Integrations.Express({
        request: true,
        serverName: true,
        matchedRoutes: true,
      }),
      new Sentry.Integrations.Postgres(),
      new Sentry.Integrations.Redis(),
    ],
  });

  // Attach Sentry to Express
  app.use(Sentry.Handlers.requestHandler());
  app.use(Sentry.Handlers.tracingHandler());

  // Error handler (must be last)
  app.use(Sentry.Handlers.errorHandler());
}

export { Sentry };
```

### Step 3: Catch Errors

```typescript
import { Sentry } from './sentry';

// Manual error capture
try {
  await processPayment(payment);
} catch (error) {
  Sentry.captureException(error, {
    tags: {
      component: 'payment-service',
      event_id: payment.event_id,
    },
    extra: {
      payment_amount: payment.amount,
      student_id: payment.student_id,
    },
  });
  throw error;
}

// Automatic: All unhandled errors caught by middleware
```

### Step 4: Environment Variables

**File:** `.env.production`

```
SENTRY_DSN=https://xxxxxx@oxxxxxx.ingest.sentry.io/123456
SENTRY_ENVIRONMENT=production
SENTRY_TRACES_SAMPLE_RATE=0.1
```

### Step 5: Dashboard Configuration

Sentry automatically shows:
- 🔴 **Critical errors** (blocks payment, crashes app)
- 🟠 **High errors** (degraded functionality)
- 🟡 **Medium warnings** (performance issues)
- 📊 **Trending** (error rate over time)

---

## 2. DataDog Setup (Metrics & Performance)

### Step 1: Create DataDog Account

```bash
# Visit datadoghq.com → Sign up
# Create organization: Formatura SaaS
# Select region: US or EU
```

### Step 2: Backend Integration

**File:** `packages/backend/src/datadog.ts`

```typescript
import { StatsDClient } from 'datadog-statsd';

export const datadog = new StatsDClient({
  host: process.env.DD_AGENT_HOST || 'localhost',
  port: process.env.DD_AGENT_PORT || 8125,
  prefix: 'formatura-saas.',
  tags: [
    `env:${process.env.NODE_ENV}`,
    `service:backend`,
    `version:${process.env.APP_VERSION}`,
  ],
});

export function instrumentExpress(app: any) {
  // Track request metrics
  app.use((req: any, res: any, next: any) => {
    const start = Date.now();

    res.on('finish', () => {
      const duration = Date.now() - start;
      datadog.histogram('http.request.duration', duration, {
        method: req.method,
        path: req.path,
        status: res.statusCode,
      });
      datadog.increment('http.requests', 1, {
        method: req.method,
        status: res.statusCode,
      });
    });

    next();
  });
}

// Track database queries
export function trackQuery(query: string, duration: number) {
  datadog.histogram('db.query.duration', duration, {
    query: query.split(' ')[0], // Just the command (SELECT, INSERT, etc)
  });
}

// Track API operations
export function trackPaymentOperation(operation: string, success: boolean) {
  datadog.increment('payment.operations', 1, {
    operation,
    status: success ? 'success' : 'failure',
  });
}
```

### Step 3: Frontend Integration

**File:** `packages/web/src/lib/datadog.ts`

```typescript
import { datadogRum } from '@datadog/browser-rum';

export function initDatadog() {
  datadogRum.init({
    applicationId: process.env.NEXT_PUBLIC_DATADOG_APP_ID,
    clientToken: process.env.NEXT_PUBLIC_DATADOG_CLIENT_TOKEN,
    site: 'datadoghq.com',
    service: 'formatura-saas-frontend',
    env: process.env.NODE_ENV,
    version: process.env.NEXT_PUBLIC_APP_VERSION,
    sessionSampleRate: 100,
    sessionReplaySampleRate: 20,
    trackUserInteractions: true,
    trackResources: true,
    trackLongTasks: true,
    defaultPrivacyLevel: 'mask-user-input',
  });

  datadogRum.startSessionReplayRecording();
}
```

### Step 4: Environment Variables

**File:** `.env.production`

```
DD_AGENT_HOST=datadog-agent.formatura.com
DD_AGENT_PORT=8125
DD_SITE=datadoghq.com
DD_ENV=production

NEXT_PUBLIC_DATADOG_APP_ID=xxxxxxxx
NEXT_PUBLIC_DATADOG_CLIENT_TOKEN=xxxxxxxx
NEXT_PUBLIC_APP_VERSION=1.0.0
```

### Step 5: Custom Metrics

```typescript
// Track business metrics
datadog.gauge('payment_scheduled', totalScheduled, {
  event_id: eventId,
});

datadog.gauge('payment_collected', totalCollected, {
  event_id: eventId,
});

datadog.gauge('payment_pending', totalPending, {
  event_id: eventId,
});

// Track user metrics
datadog.increment('user.signup', 1);
datadog.increment('user.login', 1);
datadog.histogram('user.session.duration', duration);
```

---

## 3. Key Metrics to Monitor

### Backend Metrics

```
Request Performance:
├─ http.request.duration (ms)
├─ http.requests (count)
├─ http.errors (count)
└─ http.status_codes (distribution)

Database:
├─ db.query.duration (ms)
├─ db.connections (gauge)
├─ db.slow_queries (count)
└─ db.errors (count)

Business Logic:
├─ payment.operations (count)
├─ payment.success_rate (%)
├─ contract.signatures (count)
├─ payment.collection_rate (%)
└─ webhook.asaas.reliability (%)

Resources:
├─ cpu.usage (%)
├─ memory.usage (%)
├─ disk.usage (%)
└─ request_queue.length
```

### Frontend Metrics

```
User Experience:
├─ page.load_time (ms)
├─ page.time_to_interactive (ms)
├─ core_web_vitals (LCP, FID, CLS)
├─ user_interactions (clicks, form_submissions)
└─ javascript_errors (count)

Business:
├─ payment.button_clicks (count)
├─ contract.download (count)
├─ contract.signatures (count)
└─ form.abandonment_rate (%)

Availability:
├─ api.response_time (ms)
├─ api.success_rate (%)
└─ page.uptime (%)
```

---

## 4. Alerting Rules

### Critical (Immediate Slack Notification)

```
🔴 Payment processing failing > 10% errors in 5 min
   → Likely ASAAS integration issue
   → Action: Check ASAAS dashboard, verify webhooks

🔴 Database down or unreachable
   → Critical: No data access
   → Action: Check Supabase status, verify connection string

🔴 API response time > 5s for 50%+ requests
   → User experience degraded
   → Action: Check CPU/memory, identify slow queries

🔴 Contract signature webhook failing
   → Critical business flow broken
   → Action: Check webhook configuration, retry manually
```

### High (Slack Notification with 30-min escalation)

```
🟠 Error rate > 5% for 10 minutes
   → Action: Investigate error types, check recent deploys

🟠 Database connections > 80% of pool
   → Connection leak possible
   → Action: Check for long-running queries, restart service

🟠 RLS policy violations detected
   → Security concern
   → Action: Review recent policy changes, audit logs
```

### Medium (Daily Digest)

```
🟡 Error rate 1-5%
🟡 Slow queries (> 1s)
🟡 Budget alerts (storage, bandwidth)
```

---

## 5. Dashboard Setup

### Executive Dashboard

```
┌──────────────────────────────────────┐
│   Formatura SaaS — Health Dashboard   │
├──────────────────────────────────────┤
│                                      │
│  🟢 System Status: HEALTHY           │
│                                      │
│  Uptime: 99.95% (30 days)            │
│  Response Time: 125ms (avg)          │
│  Error Rate: 0.3%                    │
│  Payment Success: 98.5%              │
│                                      │
│  ┌──────────────────────────────┐   │
│  │ Payment Collection Trend     │   │
│  │ ↗↗↗ 95% → 97% → 98%         │   │
│  └──────────────────────────────┘   │
│                                      │
│  Last Incident: 2 weeks ago          │
│  Next Maintenance: 2026-03-15        │
│                                      │
└──────────────────────────────────────┘
```

### Operations Dashboard

```
Real-time metrics:
├─ Request rate (req/s)
├─ Error rate (%)
├─ DB connections
├─ API response time (ms)
├─ CPU/Memory usage
└─ Recent errors (live list)
```

---

## 6. Incident Response

### When Alert Fires

```
1. Alert received in Slack
   ├─ Severity: 🔴 CRITICAL
   ├─ Issue: Payment processing failing
   └─ Link: https://sentry.io/organizations/.../issues/12345

2. On-call engineer:
   ├─ Click link → See error details
   ├─ Check affected transactions
   ├─ Review recent code changes (git log)
   └─ Decide: Fix vs Rollback

3. Fix (if safe):
   ├─ Identify root cause
   ├─ Create hotfix branch
   ├─ Deploy via PR (all checks run)
   └─ Verify alert clears

4. Rollback (if critical):
   ├─ git revert {bad-commit-hash}
   ├─ git push origin main
   └─ Auto-deploy to previous version

5. Post-incident:
   ├─ Write incident summary
   ├─ Schedule postmortem
   ├─ Add monitoring/testing to prevent
   └─ Update runbooks
```

---

## 7. Cost Estimation

| Service | Plan | Cost | Features |
|---------|------|------|----------|
| **Sentry** | Team | $29/mo | Unlimited events, error tracking |
| **DataDog** | Pro | $15/day | Metrics, logs, real-time alerts |
| **Total** | - | **~$500/mo** | Full observability |

**Can start with free tier during MVP and upgrade post-launch.**

---

## 8. Setup Checklist

### Sentry
- [ ] Create account
- [ ] Create project (backend)
- [ ] Copy DSN
- [ ] Install SDK: `npm install @sentry/node @sentry/tracing`
- [ ] Initialize in app
- [ ] Set environment variables
- [ ] Test with sample error
- [ ] Configure alerts
- [ ] Connect to Slack

### DataDog
- [ ] Create account
- [ ] Create application (RUM)
- [ ] Install SDK: `npm install @datadog/browser-rum`
- [ ] Install backend agent (optional, can use serverless)
- [ ] Initialize in app
- [ ] Set environment variables
- [ ] Create custom metrics
- [ ] Create dashboards
- [ ] Configure alerts
- [ ] Connect to Slack

### Slack Integration
- [ ] Create Slack app for alerts
- [ ] Connect Sentry → Slack
- [ ] Connect DataDog → Slack
- [ ] Test alert notifications
- [ ] Configure escalation (30-min rule)
- [ ] Document on-call procedures

---

## 9. Monitoring Roadmap

### Week 1-2: Baseline
- ✅ Sentry error tracking
- ✅ DataDog basic metrics
- ✅ Slack notifications

### Week 3-4: Enhanced
- ✅ Custom business metrics
- ✅ Database performance tracking
- ✅ RLS policy monitoring
- ✅ Payment success tracking

### Week 5-8: Advanced
- ✅ Distributed tracing
- ✅ Session replay (DataDog)
- ✅ Custom anomaly detection
- ✅ Automated incident response

---

## Status: Configuration Complete

**What's documented:**
- ✅ Sentry (error tracking) setup
- ✅ DataDog (metrics) setup
- ✅ Key metrics to monitor
- ✅ Alerting rules
- ✅ Dashboard configuration
- ✅ Incident response procedure

**Next steps:**
1. Create Sentry account
2. Create DataDog account
3. Install SDKs in backend/frontend
4. Set environment variables
5. Test with sample error
6. Configure Slack alerts
7. Document on-call procedures

---

**Status:** ✅ Ready for Implementation

Gage (DevOps) — 3 de Março, 2026

*Formatura SaaS — Monitoring & Observability Setup Complete*
