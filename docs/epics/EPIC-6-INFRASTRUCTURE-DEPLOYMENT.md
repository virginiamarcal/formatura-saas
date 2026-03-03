# EPIC-6: Infrastructure & Deployment

**Epic ID:** EPIC-6
**Title:** Infrastructure, CI/CD, & Production Readiness
**Status:** Draft
**Created:** 2026-03-03
**Owner:** @pm (Morgan)

---

## 📋 Epic Overview

**Objective:** Set up cloud infrastructure, CI/CD pipeline, monitoring, and deployment automation.

**User Value Proposition:**
- **Team:** Automated testing, reliable deployments, production monitoring
- **Users:** High-availability platform, automatic backups, disaster recovery

**Success Metrics:**
- [ ] 99.9% uptime SLA
- [ ] Deployment < 10 minutes
- [ ] 0-downtime migrations
- [ ] Automated backup + 7-day retention
- [ ] Alert response time < 5 minutes

---

## 📊 Scope & Stories

### Story 6.1: Supabase Setup & Database Deployment
**Points:** 8
**Dependencies:** Database schema ready (Dara: ✅)

- [ ] Supabase project created
- [ ] Schema deployed (00-schema-complete.sql)
- [ ] RLS policies enabled
- [ ] Backups configured (7-day retention)
- [ ] Connection pooler enabled (PgBouncer)
- [ ] Monitor: DB connections, slow queries

### Story 6.2: Express Backend Deployment (Railway/Render)
**Points:** 13
**Dependencies:** 6.1

- [ ] Express app containerized (Docker)
- [ ] Environment variables configured (.env.production)
- [ ] Health check endpoint (/health)
- [ ] Graceful shutdown (SIGTERM handling)
- [ ] Auto-scaling configured (1-3 dynos)
- [ ] Monitoring: CPU, memory, error rate

### Story 6.3: Next.js Frontend Deployment (Vercel)
**Points:** 8
**Dependencies:** 6.1, 6.2

- [ ] Next.js build optimized (image, bundle size)
- [ ] Vercel deployment configured
- [ ] Preview environments (per PR)
- [ ] Staging environment
- [ ] Production environment
- [ ] SSL/TLS configured

### Story 6.4: CI/CD Pipeline (GitHub Actions)
**Points:** 13
**Dependencies:** 6.2, 6.3

- [ ] Lint check on every commit (ESLint)
- [ ] Type check (TypeScript)
- [ ] Unit tests (Jest)
- [ ] E2E tests (Playwright)
- [ ] Security scan (CodeRabbit)
- [ ] Build artifacts cached
- [ ] Staging deployment on PR
- [ ] Production deployment on merge to main
- [ ] Automatic rollback on failure

### Story 6.5: Monitoring, Logging & Alerts
**Points:** 13
**Dependencies:** 6.2, 6.3

- [ ] Error tracking (Sentry)
- [ ] Structured logging (Winston/Pino)
- [ ] Database monitoring (query logs, slow queries)
- [ ] API monitoring (response time, error rate)
- [ ] Uptime monitoring (StatusPage)
- [ ] Slack alerts on critical errors
- [ ] PagerDuty on-call rotation
- [ ] Dashboard: Key metrics (Grafana/Datadog)

### Story 6.6: Security & Compliance
**Points:** 13
**Dependencies:** 6.1, 6.2, 6.3

- [ ] HTTPS/TLS 1.3 enforced
- [ ] CORS configured (whitelist origins)
- [ ] Rate limiting implemented (100 req/min per user)
- [ ] WAF rules (CloudFlare)
- [ ] Secrets management (no .env in repo)
- [ ] GDPR data handling (PII redaction in logs)
- [ ] Security audit: CodeRabbit + manual review
- [ ] Penetration testing (Phase 2)

### Story 6.7: Backup & Disaster Recovery
**Points:** 8
**Dependencies:** 6.1

- [ ] Supabase automated backups (7 days)
- [ ] Point-in-time recovery (PITR) enabled
- [ ] Test restore procedure monthly
- [ ] Backup to S3 (long-term, 7 years)
- [ ] Disaster recovery plan documented
- [ ] RTO target: < 4 hours
- [ ] RPO target: < 1 hour

### Story 6.8: Documentation & Runbooks
**Points:** 8
**Dependencies:** All above

- [ ] API documentation (Swagger/OpenAPI)
- [ ] Deployment runbook
- [ ] Incident response playbook
- [ ] Troubleshooting guide
- [ ] Architecture diagram (updated)
- [ ] Data flow diagram
- [ ] Security checklist

---

## 🎯 Acceptance Criteria

- [x] Database deployed (Dara completed)
- [ ] Backend deployed to staging
- [ ] Frontend deployed to staging
- [ ] CI/CD pipeline working
- [ ] All tests passing
- [ ] Monitoring configured
- [ ] Alerts configured
- [ ] Documentation complete
- [ ] Security audit passed
- [ ] Load testing completed (1000 concurrent users)

---

## 🗺️ Deployment Architecture

```
┌─────────────────────────────────────────┐
│         Vercel (Next.js Frontend)       │ (auto-deploy on main)
└──────────────┬──────────────────────────┘
               │ HTTPS
┌──────────────▼──────────────────────────┐
│   Railway/Render (Express Backend)      │ (auto-deploy on main)
│   ├─ Health check: /health              │
│   └─ Auto-scaling: 1-3 dynos            │
└──────────────┬──────────────────────────┘
               │ DATABASE_URL
┌──────────────▼──────────────────────────┐
│      Supabase (PostgreSQL + Auth)       │
│      ├─ Backups: 7 days + S3 (7yr)     │
│      ├─ RLS: Enabled on all tables     │
│      └─ Connection pooler: PgBouncer   │
└─────────────────────────────────────────┘

External Integrations:
├─ ASAAS (Webhooks)
├─ WhatsApp API
├─ Sentry (Error tracking)
├─ Slack (Alerts)
└─ StatusPage (Uptime)
```

---

## 📈 Roadmap

| Phase | Duration | Deliverables |
|-------|----------|--------------|
| **Alpha** | 1 week | Stories 6.1, 6.2, 6.3 (deployment) |
| **Beta** | 1 week | Stories 6.4, 6.5 (CI/CD, monitoring) |
| **Gamma** | 1 week | Stories 6.6, 6.7, 6.8 (security, docs) |

---

**Epic Owner:** Morgan (PM)
**DevOps Lead:** @devops (Gage)

---

*Formatura SaaS — EPIC-6: Infrastructure & Deployment*
