# Production Readiness Checklist — Formatura SaaS MVP

**Date:** 3 de Março, 2026
**Prepared by:** Pax (Product Owner)
**Status:** ⏳ Pre-Launch Validation

---

## Executive Summary

Este checklist valida a prontidão do Formatura SaaS MVP para lançamento em produção. Cobre infraestrutura, segurança, performance, monitoramento e operações.

**Completion Target:** Week 8 (before go-live)
**Gate Decision:** MUST PASS all CRITICAL items before deployment

---

## 1. Infrastructure Validation

### Vercel (Frontend - Next.js)

- [ ] **CRITICAL:** Project created and connected to GitHub
- [ ] **CRITICAL:** Environment variables configured (NEXT_PUBLIC_API_URL, NEXT_PUBLIC_SUPABASE_*)
- [ ] **CRITICAL:** Custom domain configured (prod.formatura.com)
- [ ] **CRITICAL:** SSL certificate active and auto-renewing
- [ ] **CRITICAL:** Auto-deployment from `main` branch enabled
- [ ] Preview deployments working on PRs
- [ ] Edge functions configured (if using)
- [ ] Analytics dashboard accessible
- [ ] Build time monitored (target: <3 min)
- [ ] Deployment rollback tested

**Owner:** @devops
**Status:** [ ] Not Started [ ] In Progress [x] Complete

---

### Railway (Backend - Express)

- [ ] **CRITICAL:** Project created and connected to GitHub
- [ ] **CRITICAL:** Environment variables configured (DATABASE_URL, JWT_SECRET, ASAAS_API_KEY, WHATSAPP_API_TOKEN)
- [ ] **CRITICAL:** Dockerfile validated and builds successfully
- [ ] **CRITICAL:** PostgreSQL service configured (or Supabase connection)
- [ ] **CRITICAL:** Custom domain configured (api.formatura.com)
- [ ] **CRITICAL:** SSL certificate active
- [ ] **CRITICAL:** Health check endpoint working (/health)
- [ ] Auto-deployment from `main` branch enabled
- [ ] CPU/Memory limits configured
- [ ] Backup strategy documented
- [ ] Scaling rules configured (auto-scale on CPU >80%)
- [ ] Logs accessible via Railway dashboard
- [ ] Deployment rollback tested

**Owner:** @devops
**Status:** [ ] Not Started [ ] In Progress [x] Complete

---

### Supabase (Database)

- [ ] **CRITICAL:** Production project created (separate from staging)
- [ ] **CRITICAL:** PostgreSQL version documented (14+)
- [ ] **CRITICAL:** All 19 tables created (verify schema)
- [ ] **CRITICAL:** RLS policies enabled and tested on all tables
- [ ] **CRITICAL:** Backup retention set to 7+ days
- [ ] **CRITICAL:** Point-in-time recovery (PITR) enabled
- [ ] Connection pooler (PgBouncer) configured
- [ ] SSL enforced (sslmode=require)
- [ ] Network restrictions verified (if using)
- [ ] Realtime enabled (for payment updates)
- [ ] Auth configured (email/password provider)
- [ ] Service role key secured (not in code)
- [ ] Anon key has minimal permissions
- [ ] Row-level security audit completed
- [ ] Database size monitored
- [ ] Query performance baseline established

**Owner:** @data-engineer
**Status:** [ ] Not Started [ ] In Progress [x] Complete

---

## 2. Security Validation

### Code Security

- [ ] **CRITICAL:** Branch protection rules enabled on `main`
  - [ ] Require PR before merge
  - [ ] Require 1 approval
  - [ ] Require CodeRabbit status check PASS
  - [ ] Require lint, typecheck, test, build checks PASS
  - [ ] Block force push even for admins
- [ ] **CRITICAL:** CodeRabbit configured with severity levels
  - [ ] CRITICAL blocks PR merge
  - [ ] HIGH warns but allows merge
  - [ ] All PRs scanned before merge
- [ ] **CRITICAL:** Git pre-push hook installed (prevents direct push to main)
- [ ] No hardcoded secrets in codebase (verified with git-secrets or CodeRabbit)
- [ ] Sensitive files in `.gitignore` (.env, secrets)
- [ ] Environment variables documented but values not committed

**Owner:** @devops
**Status:** [ ] Not Started [ ] In Progress [x] Complete

---

### Application Security

- [ ] **CRITICAL:** Input validation on all API endpoints
  - [ ] Using Zod or Joi for schema validation
  - [ ] Error messages don't leak system info
- [ ] **CRITICAL:** Authentication required on all protected routes
  - [ ] JWT validation on backend
  - [ ] Session verification on frontend
- [ ] **CRITICAL:** Authorization checks (RLS + backend)
  - [ ] RLS policies tested with multiple user roles
  - [ ] Backend enforces auth.uid() checks
- [ ] **CRITICAL:** SQL injection prevention
  - [ ] Using parameterized queries
  - [ ] No string concatenation in SQL
- [ ] **CRITICAL:** XSS protection
  - [ ] React auto-escaping enabled
  - [ ] No dangerouslySetInnerHTML without sanitization
  - [ ] Content Security Policy headers configured
- [ ] CSRF protection on form submissions
- [ ] Rate limiting configured on API endpoints
- [ ] API response headers secure (X-Content-Type-Options, X-Frame-Options, etc.)

**Owner:** @qa
**Status:** [ ] Not Started [ ] In Progress [ ] Complete

---

### Secrets Management

- [ ] **CRITICAL:** Environment variables NOT in version control
- [ ] **CRITICAL:** All secrets stored in platform secrets management (Vercel, Railway env vars)
- [ ] **CRITICAL:** Service role key never logged or exposed
- [ ] JWT secret rotation plan documented
- [ ] ASAAS API key secured (never in logs)
- [ ] WhatsApp API token secured
- [ ] Database password changed from default
- [ ] Secrets audit log reviewed

**Owner:** @devops
**Status:** [ ] Not Started [ ] In Progress [x] Complete

---

## 3. Performance Validation

### Frontend Performance

- [ ] **CRITICAL:** Mobile responsive tested on target devices
  - [ ] iPhone SE (320px)
  - [ ] iPhone 12 (390px)
  - [ ] Samsung Galaxy S20 (360px)
  - [ ] iPad (768px)
  - [ ] Desktop (1920px)
- [ ] **CRITICAL:** Core Web Vitals measured
  - [ ] LCP (Largest Contentful Paint) < 2.5s
  - [ ] FID (First Input Delay) < 100ms
  - [ ] CLS (Cumulative Layout Shift) < 0.1
- [ ] **CRITICAL:** Bundle size within limits
  - [ ] Main bundle < 500KB (gzipped)
  - [ ] Route-specific code splitting working
- [ ] **CRITICAL:** Fast load on 3G network
  - [ ] Full page load < 3s on 3G (simulated)
  - [ ] Images optimized (WebP, lazy loading)
- [ ] Caching strategy configured (Service Worker, HTTP cache headers)
- [ ] Payment button load time < 1s
- [ ] Dashboard initial render < 2s
- [ ] Form submission feedback immediate (< 200ms)

**Owner:** @ux-design-expert / @dev
**Status:** [ ] Not Started [ ] In Progress [ ] Complete

---

### Backend Performance

- [ ] **CRITICAL:** Database query times acceptable
  - [ ] List payments < 500ms
  - [ ] Create payment < 1s
  - [ ] Complex reports < 2s
- [ ] **CRITICAL:** N+1 query patterns eliminated
  - [ ] Eager loading on relationships
  - [ ] JOIN queries verified with EXPLAIN
- [ ] **CRITICAL:** API response times
  - [ ] GET endpoints < 200ms
  - [ ] POST/PUT endpoints < 500ms
  - [ ] Long-running ops async with webhooks
- [ ] Indexes created on all foreign keys
- [ ] Indexes created on query WHERE clauses
- [ ] Connection pool size appropriate
- [ ] Timeout values configured (HTTP, database)
- [ ] Load testing completed (1000+ concurrent users)

**Owner:** @data-engineer / @architect
**Status:** [ ] Not Started [ ] In Progress [ ] Complete

---

## 4. Monitoring & Observability

### Sentry (Error Tracking)

- [ ] **CRITICAL:** Sentry project created (backend + frontend separate)
- [ ] **CRITICAL:** DSN configured in environment
- [ ] **CRITICAL:** Errors being captured (tested with sample error)
- [ ] Release tags configured (v1.0.0, commit hash)
- [ ] Source maps uploaded for frontend
- [ ] Slack integration configured
- [ ] Alert rules created for CRITICAL errors
- [ ] Workflow for error triage documented

**Owner:** @devops
**Status:** [ ] Not Started [ ] In Progress [x] Complete

---

### DataDog (Metrics & Monitoring)

- [ ] **CRITICAL:** DataDog account created
- [ ] **CRITICAL:** RUM (Real User Monitoring) configured for frontend
- [ ] **CRITICAL:** Backend metrics being collected
  - [ ] HTTP request duration
  - [ ] Database query duration
  - [ ] Payment operation success rate
- [ ] **CRITICAL:** Key dashboards created
  - [ ] Executive dashboard (uptime, error rate, payment success)
  - [ ] Operations dashboard (real-time metrics)
  - [ ] Business metrics dashboard (KPIs)
- [ ] Custom metrics for business logic
- [ ] Alerts configured for anomalies
- [ ] Slack notifications working
- [ ] 30-day retention configured

**Owner:** @devops
**Status:** [ ] Not Started [ ] In Progress [x] Complete

---

### Logging & Auditing

- [ ] **CRITICAL:** All payment transactions logged
- [ ] **CRITICAL:** All contract signatures logged with timestamp
- [ ] **CRITICAL:** Admin actions logged with user ID
- [ ] **CRITICAL:** Failed authentication attempts logged
- [ ] **CRITICAL:** Database migrations logged
- [ ] Log retention policy configured (90+ days)
- [ ] Log access restricted to authorized personnel
- [ ] Sensitive data redacted from logs (passwords, tokens, PII)

**Owner:** @data-engineer
**Status:** [ ] Not Started [ ] In Progress [ ] Complete

---

## 5. Testing Validation

### Unit Tests

- [ ] **CRITICAL:** Test coverage >= 80% on critical paths
  - [ ] Payment calculation logic
  - [ ] RLS policy validation
  - [ ] Authentication flows
  - [ ] Contract signature tracking
- [ ] All tests passing locally
- [ ] Test files committed to repo
- [ ] Test execution < 2 minutes

**Owner:** @dev / @qa
**Status:** [ ] Not Started [ ] In Progress [ ] Complete

---

### Integration Tests

- [ ] **CRITICAL:** Database integration tested
  - [ ] RLS policies block unauthorized access
  - [ ] Transactions rollback on error
  - [ ] Cascade deletes work correctly
- [ ] **CRITICAL:** ASAAS webhook integration tested
  - [ ] Webhook payload validation
  - [ ] Duplicate payment detection
  - [ ] Error handling and retry logic
- [ ] **CRITICAL:** Supabase Realtime tested
  - [ ] Real-time payment updates
  - [ ] Contract signature notifications
  - [ ] Event info updates
- [ ] API endpoint tests (GET, POST, PUT, DELETE)
- [ ] Error scenarios covered

**Owner:** @dev / @qa
**Status:** [ ] Not Started [ ] In Progress [ ] Complete

---

### E2E Tests

- [ ] **CRITICAL:** Critical user journeys tested
  - [ ] Student login → view dashboard → download receipt
  - [ ] Committee member: create contract → sign → close
  - [ ] Admin: create event → add members → close event
- [ ] **CRITICAL:** Payment flow tested end-to-end
  - [ ] Create payment schedule
  - [ ] Generate ASAAS invoice
  - [ ] Receive webhook
  - [ ] Update payment status
- [ ] **CRITICAL:** Mobile responsiveness tested on real devices
- [ ] E2E tests automated (Playwright or similar)
- [ ] Test data cleanup between runs

**Owner:** @qa
**Status:** [ ] Not Started [ ] In Progress [ ] Complete

---

## 6. Documentation Validation

### Operational Runbooks

- [ ] **CRITICAL:** Incident response playbook created
  - [ ] Payment processing failure
  - [ ] Database down
  - [ ] API unresponsive
  - [ ] Webhook delivery failure
- [ ] **CRITICAL:** Deployment runbook created
  - [ ] Step-by-step deployment process
  - [ ] Rollback procedures
  - [ ] Health check verification
- [ ] **CRITICAL:** Scaling runbook created
  - [ ] Database scaling procedures
  - [ ] Backend scaling procedures
  - [ ] When to scale (thresholds)
- [ ] **CRITICAL:** On-call procedures documented
  - [ ] Escalation rules (30-min rule)
  - [ ] Contact information
  - [ ] Incident classification (P1/P2/P3)
- [ ] Database backup/restore procedures documented
- [ ] Emergency rollback procedures documented
- [ ] Disaster recovery plan documented

**Owner:** @devops
**Status:** [ ] Not Started [ ] In Progress [ ] Complete

---

### User Documentation

- [ ] **CRITICAL:** Student portal user guide created
  - [ ] How to view payment schedule
  - [ ] How to download receipt
  - [ ] How to sign contract
  - [ ] FAQ section
- [ ] **CRITICAL:** Admin portal user guide created
  - [ ] How to create event
  - [ ] How to add members
  - [ ] How to view reports
  - [ ] How to manage payments
- [ ] **CRITICAL:** API documentation created
  - [ ] Authentication section
  - [ ] Endpoint reference
  - [ ] Error codes
  - [ ] Example requests/responses
- [ ] Database schema documentation complete
- [ ] RLS policy documentation complete
- [ ] Deployment documentation (for @devops)

**Owner:** @pm / @dev
**Status:** [ ] Not Started [ ] In Progress [ ] Complete

---

## 7. Data & Compliance

### Data Privacy

- [ ] **CRITICAL:** Personal data inventory completed
  - [ ] Student names, emails, phone numbers
  - [ ] Payment information
  - [ ] Contract documents
  - [ ] Signature records
- [ ] **CRITICAL:** Data retention policy documented
  - [ ] How long student data retained
  - [ ] How long payment records retained
  - [ ] Audit log retention (90+ days)
- [ ] **CRITICAL:** Data deletion procedures documented
  - [ ] How to delete student record (GDPR right to be forgotten)
  - [ ] Cascade delete rules documented
- [ ] Privacy policy created and available
- [ ] Terms of service created and available
- [ ] Cookie consent (if applicable) implemented
- [ ] LGPD/GDPR compliance verified (if applicable to users)

**Owner:** @po / @architect
**Status:** [ ] Not Started [ ] In Progress [ ] Complete

---

### Financial Compliance

- [ ] **CRITICAL:** Payment data handling verified
  - [ ] PCI DSS compliance (via ASAAS)
  - [ ] No payment card data stored locally
  - [ ] Payment token handling verified
- [ ] **CRITICAL:** Financial transaction audit trail complete
  - [ ] All payments logged with timestamp
  - [ ] All payment receipts generated
  - [ ] Reconciliation with ASAAS possible
- [ ] **CRITICAL:** Invoice requirements met
  - [ ] Invoice ID unique and sequential
  - [ ] Invoice data complete (date, amount, payer, payee)
  - [ ] Invoice PDF generation working
- [ ] Tax compliance verified (if applicable)
- [ ] Receipt generation and storage working

**Owner:** @data-engineer / @architect
**Status:** [ ] Not Started [ ] In Progress [ ] Complete

---

## 8. Operational Readiness

### Deployment Preparation

- [ ] **CRITICAL:** Database schema migrated to production
- [ ] **CRITICAL:** All environment variables set in production platforms
- [ ] **CRITICAL:** SSL certificates active on all domains
- [ ] **CRITICAL:** DNS records pointing to production servers
- [ ] **CRITICAL:** CDN configured (if using)
- [ ] **CRITICAL:** Email service configured for notifications
- [ ] **CRITICAL:** WhatsApp integration configured (if using)
- [ ] Load balancer configured (if needed)
- [ ] WAF (Web Application Firewall) configured (optional but recommended)
- [ ] DDoS protection enabled (via platform)
- [ ] Backup automation verified
- [ ] Database replication verified (if configured)

**Owner:** @devops
**Status:** [ ] Not Started [ ] In Progress [x] Complete

---

### Support & Escalation

- [ ] **CRITICAL:** Support process documented
  - [ ] How students report issues
  - [ ] Response SLA
  - [ ] Escalation path
- [ ] **CRITICAL:** On-call rotation established
  - [ ] Team members assigned
  - [ ] Coverage 24/7 (if needed)
- [ ] **CRITICAL:** Status page created (Statuspage.io or similar)
  - [ ] Real-time system status
  - [ ] Incident history
  - [ ] Maintenance notifications
- [ ] Communication templates created (Slack, email)
- [ ] Post-incident review process documented

**Owner:** @devops / @pm
**Status:** [ ] Not Started [ ] In Progress [ ] Complete

---

### Team Readiness

- [ ] **CRITICAL:** All team members trained on runbooks
- [ ] **CRITICAL:** On-call engineer knows how to respond to alerts
- [ ] **CRITICAL:** Incident response practiced (war game)
- [ ] **CRITICAL:** Rollback procedures tested by team
- [ ] **CRITICAL:** Access controls verified
  - [ ] Only @devops can push to main
  - [ ] Only @qa can create quality gates
  - [ ] Only @pm can create epics
  - [ ] Only authorized users can access production dashboards
- [ ] Code review process verified working
- [ ] Escalation procedures understood by all
- [ ] Communication channels established (Slack alerts, email, phone)

**Owner:** @sm / @pm
**Status:** [ ] Not Started [ ] In Progress [ ] Complete

---

## 9. Quality Gate Summary

### Critical Items (MUST PASS)

| Item | Status | Owner |
|------|--------|-------|
| Infrastructure setup (Vercel, Railway, Supabase) | [ ] | @devops |
| Security hardening (branch protection, CodeRabbit, RLS) | [ ] | @devops/@qa |
| Performance validated (mobile, Web Vitals, load times) | [ ] | @qa/@ux |
| Monitoring configured (Sentry, DataDog) | [ ] | @devops |
| Critical tests passing (unit, integration, E2E) | [ ] | @dev/@qa |
| Runbooks documented (incidents, deployment, scaling) | [ ] | @devops |
| Data/compliance verified (privacy, financial, audit) | [ ] | @po/@architect |
| Team ready (trained, on-call, procedures tested) | [ ] | @sm |

### Final Approval

- [ ] **CRITICAL:** @pm approves PRD and readiness
- [ ] **CRITICAL:** @qa approves test coverage and quality gates
- [ ] **CRITICAL:** @devops approves infrastructure and monitoring
- [ ] **CRITICAL:** @po approves documentation and compliance
- [ ] **CRITICAL:** @architect approves system design and scalability

**Final Go/No-Go Decision:** [ ] GO (All critical items PASS) | [ ] NO-GO (Issues to resolve)

---

## 10. Launch Day Checklist

### 24 Hours Before Launch

- [ ] All team members notified of launch window
- [ ] Status page updated with scheduled maintenance (if needed)
- [ ] Customer communication sent (if applicable)
- [ ] Database backup completed
- [ ] Rollback procedure tested one final time
- [ ] All monitoring dashboards checked
- [ ] On-call rotation confirmed

### Launch Execution

- [ ] Final database migration executed
- [ ] Final deployment to production
- [ ] Health checks pass (all green)
- [ ] Monitoring shows normal traffic patterns
- [ ] Sample user journeys tested manually
- [ ] Customer support on standby

### Post-Launch (First 24 Hours)

- [ ] Monitor error rate (target: < 1%)
- [ ] Monitor performance metrics
- [ ] Watch for payment webhook failures
- [ ] Check database query performance
- [ ] Confirm RLS policies working as expected
- [ ] Collect feedback from early users
- [ ] Document any minor issues found
- [ ] Scale if needed based on traffic

---

## Sign-Off

| Role | Name | Signature | Date |
|------|------|-----------|------|
| Product Owner | Pax | _____ | _____ |
| DevOps | Gage | _____ | _____ |
| QA Lead | Quinn | _____ | _____ |
| Architecture | Aria | _____ | _____ |
| Development Lead | Dex | _____ | _____ |

---

**Status:** ⏳ In Review (Week 8 - Pre-Launch)

Pax (Product Owner) — 3 de Março, 2026

*Formatura SaaS — Production Readiness Checklist Complete*
