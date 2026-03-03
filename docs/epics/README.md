# Formatura SaaS — Development Epics v1.0

**Date:** 3 de Março, 2026
**Created by:** Morgan (PM)
**Status:** ✅ Draft → Ready for Story Breakdown
**Base:** ARCHITECTURE.md + Database Schema (Dara)

---

## 📋 Executive Summary

Formatura SaaS MVP é dividido em **6 Epics** que cobrem o ciclo de vida completo de um evento de formatura: proposta → contrato → pagamento → relatório.

**Total Scope:**
- 6 Epics
- ~45 Stories (detailed in each epic)
- ~250-350 story points (estimated)
- **Duration:** 8-12 weeks (MVP)

---

## 🗺️ Epic Map

```
┌─────────────────────────────────────────────────────────┐
│                     MVP Timeline                         │
├─────────────────────────────────────────────────────────┤
│
│ Week 1-2: EPIC-1 (Proposals) + EPIC-3 (Payments Start)
│ Week 3-4: EPIC-2 (Contracts) + EPIC-3 (Payments End)
│ Week 5-6: EPIC-4 (Student Dashboard) + EPIC-5 (Reporting)
│ Week 7-8: EPIC-6 (Infrastructure & Deployment)
│
│ Parallel: Testing, Documentation, Security Audit
│
└─────────────────────────────────────────────────────────┘
```

---

## 📊 Epics Overview

### EPIC-1: Proposal & Quotation System
**Owner:** Morgan (PM)
**Lead:** Aria (Architect)
**Database:** ✅ Ready (proposals, quotations, vendors)

**Goal:** Admins create proposals, request quotes from vendors, track responses.

**Stories:** 7
- 1.1: Admin creates proposal template
- 1.2: Admin sends to committee
- 1.3: Committee reviews
- 1.4: Admin requests quotations (RFQ)
- 1.5: Vendor submits quotation
- 1.6: Admin compares & approves
- 1.7: Quotation audit & search

**Success Metrics:**
- 80% faster vendor selection
- 100% quotation history audit trail

**Duration:** 3 weeks (Alpha 2w + Beta 1w)

---

### EPIC-2: Contract Lifecycle Management
**Owner:** Morgan (PM)
**Lead:** Aria (Architect)
**Database:** ✅ Ready (contracts, signatures)

**Goal:** Generate contracts, track signatures, maintain immutable audit trail.

**Stories:** 7
- 2.1: Generate contracts from proposals
- 2.2: Send contracts for signature
- 2.3: Signer reviews & signs (MVP: manual upload)
- 2.4: Admin tracks signature status
- 2.5: Admin executes signed contracts
- 2.6: Immutability & audit enforcement
- 2.7: Contract download & storage

**Success Metrics:**
- 100% digital signature adoption
- < 24h average signature time
- Zero unsigned contracts > 30 days

**Duration:** 4 weeks

---

### EPIC-3: Payment Management & ASAAS Integration
**Owner:** Morgan (PM)
**Lead:** Aria (Architect)
**Database:** ✅ Ready (payment_schedules, invoices, payments)

**Goal:** Payment scheduling, invoice generation, ASAAS webhook integration, vendor payouts.

**Stories:** 8
- 3.1: Admin creates payment schedule
- 3.2: Auto-generate invoices on ASAAS
- 3.3: ASAAS webhook: payment received
- 3.4: Student uploads receipt (manual)
- 3.5: Admin verifies receipts
- 3.6: Payment notifications & reminders
- 3.7: Admin reconciliation & vendor payout
- 3.8: Financial audit trail & compliance

**Success Metrics:**
- 95% on-time payment collection
- ASAAS webhook reliability 99.9%
- Zero unreconciled payments > 7 days

**Duration:** 4 weeks

---

### EPIC-4: Student Dashboard & Portal
**Owner:** Morgan (PM)
**Database:** ✅ Ready

**Goal:** Student self-service portal (contracts, payments, receipts).

**Stories:** 4
- 4.1: Login & session
- 4.2: Payment dashboard
- 4.3: Contract review & sign
- 4.4: Event information

**Success Metrics:**
- 95% student engagement
- < 2min to find payment status
- 100% self-service (no admin help)

**Duration:** 2 weeks

---

### EPIC-5: Financial Reporting & Analytics
**Owner:** Morgan (PM)
**Database:** ✅ Ready (views: event_financial_summary)

**Goal:** Admin dashboard with real-time KPIs, reports, data visualization.

**Stories:** 4
- 5.1: Financial summary dashboard
- 5.2: Vendor & expense tracking
- 5.3: Financial reports & export
- 5.4: Real-time analytics (Supabase Realtime)

**Success Metrics:**
- Dashboard loads < 2s
- 100% financial accuracy
- Reports exportable

**Duration:** 2 weeks

---

### EPIC-6: Infrastructure & Deployment
**Owner:** Morgan (PM)
**Lead:** @devops (Gage)

**Goal:** Cloud setup, CI/CD, monitoring, disaster recovery.

**Stories:** 8
- 6.1: Supabase setup
- 6.2: Express backend deployment
- 6.3: Next.js frontend deployment
- 6.4: CI/CD pipeline (GitHub Actions)
- 6.5: Monitoring & alerts
- 6.6: Security & compliance
- 6.7: Backup & disaster recovery
- 6.8: Documentation & runbooks

**Success Metrics:**
- 99.9% uptime SLA
- Deployment < 10 minutes
- 0-downtime migrations

**Duration:** 3 weeks

---

## 📈 Total Scope Breakdown

| Epic | Stories | Points | Duration | Lead |
|------|---------|--------|----------|------|
| EPIC-1 | 7 | 45 | 3w | Aria |
| EPIC-2 | 7 | 55 | 4w | Aria |
| EPIC-3 | 8 | 65 | 4w | Aria |
| EPIC-4 | 4 | 26 | 2w | Aria |
| EPIC-5 | 4 | 24 | 2w | Aria |
| EPIC-6 | 8 | 65 | 3w | Gage |
| **TOTAL** | **~45** | **~280** | **8-12w** | |

---

## 🚀 Development Waves

### Wave 1 (Weeks 1-2): Foundation
- **EPIC-1:** Stories 1.1, 1.2, 1.4, 1.5 (Proposal + RFQ)
- **EPIC-3:** Story 3.1 (Payment schedule)
- **Lead:** @dev + @qa
- **Gate:** @qa review before Wave 2

### Wave 2 (Weeks 3-4): Contracts & Payments
- **EPIC-2:** Stories 2.1-2.5 (Contract generation, signature)
- **EPIC-3:** Stories 3.2-3.6 (ASAAS, invoices, webhooks)
- **Lead:** @dev + @qa
- **Gate:** @qa review before Wave 3

### Wave 3 (Weeks 5-6): Dashboards & Reporting
- **EPIC-4:** All stories (Student dashboard)
- **EPIC-5:** Stories 5.1-5.3 (Reporting)
- **EPIC-1:** Story 1.7 (Audit)
- **Lead:** @dev + @qa

### Wave 4 (Weeks 7-8): Infrastructure & Launch
- **EPIC-6:** All stories (CI/CD, monitoring, backup)
- **EPIC-3:** Story 3.7-3.8 (Reconciliation, audit)
- **EPIC-5:** Story 5.4 (Real-time)
- **Lead:** @devops + @qa

### Parallel (All weeks)
- **Security:** CodeRabbit on every PR
- **Documentation:** API docs, runbooks
- **Testing:** Unit, integration, E2E

---

## 🎯 Success Criteria (Epic-Level Gates)

### Gate 1: EPIC-1 Approval (Week 2)
- [ ] All 7 stories completed
- [ ] RLS policies blocking cross-vendor access
- [ ] Audit triggers logging all changes
- [ ] Performance: Search < 500ms
- [ ] @qa: PASS
- [ ] CodeRabbit: No CRITICAL/HIGH issues

### Gate 2: EPIC-2 Approval (Week 4)
- [ ] All 7 stories completed
- [ ] Contracts immutable after signing
- [ ] Signature audit trail 100%
- [ ] E2E test: Generate → Send → Sign → Execute
- [ ] @qa: PASS

### Gate 3: EPIC-3 Approval (Week 4)
- [ ] ASAAS webhook integration working
- [ ] Payment reconciliation < 5min
- [ ] Financial audit trail immutable
- [ ] 95% payment collection rate (test data)
- [ ] @qa: PASS

### Gate 4: EPIC-4 Approval (Week 6)
- [ ] Student can login, view payments, sign contracts
- [ ] Mobile-responsive
- [ ] 95% engagement rate (test)
- [ ] @qa: PASS

### Gate 5: EPIC-5 Approval (Week 6)
- [ ] Dashboard loads < 2s (1000 events test)
- [ ] Reports exportable
- [ ] Real-time updates working
- [ ] @qa: PASS

### Gate 6: EPIC-6 Approval (Week 8)
- [ ] Staging environment 99.9% uptime
- [ ] CI/CD pipeline working
- [ ] Backups tested
- [ ] Security audit passed
- [ ] @qa: PASS
- [ ] Ready for production

---

## 🔗 Dependencies & Handoff

```
Database Schema ✅
       ↓
   EPIC-1 (Proposals)
   EPIC-2 (Contracts) ← depends on EPIC-1
   EPIC-3 (Payments) ← depends on EPIC-2
       ↓
   EPIC-4 (Student Dashboard)
   EPIC-5 (Reporting)
       ↓
   EPIC-6 (Infrastructure)
       ↓
   Production Launch
```

---

## 📝 Next Steps

### For @pm (Morgan):
1. ✅ Create 6 epics (done)
2. → Share with @po (Pax) for PRD validation
3. → Share with @architect (Aria) for design review
4. → Share with @sm (River) for story breakdown
5. → Share with @dev (Dex) for estimation

### For @sm (River):
- [ ] Create detailed stories (50-60 stories from epics)
- [ ] Add acceptance criteria (detailed)
- [ ] Add technical notes

### For @dev (Dex):
- [ ] Estimate story points
- [ ] Identify blockers
- [ ] Plan 2-week sprints

### For @qa (Quinn):
- [ ] Design test strategy (unit, integration, E2E)
- [ ] Create test cases per story
- [ ] Plan CodeRabbit integration

### For @devops (Gage):
- [ ] Setup Supabase project
- [ ] Configure GitHub Actions CI/CD
- [ ] Setup monitoring (Sentry, DataDog)

---

## 📊 Metrics & Monitoring

**Key Performance Indicators (MVP):**
- Sprint velocity (story points/week)
- Defect escape rate (bugs found in QA vs production)
- Code coverage (target: 80%)
- Deployment frequency (target: daily)
- Lead time (PR → production)

**Tracking:**
- GitHub Projects for task management
- CodeRabbit for code quality
- Sentry for error tracking
- Custom dashboard (EPIC-5)

---

## 🎓 Documentation

### For Developers
- [ ] API documentation (Swagger)
- [ ] Database schema guide (Dara: ✅ done)
- [ ] Coding standards (ESLint config: ✅ exists)
- [ ] Architecture decisions (ADR)

### For Operations
- [ ] Deployment runbook
- [ ] Incident response playbook
- [ ] Monitoring dashboard
- [ ] Backup & recovery procedures

### For Users
- [ ] Getting started guide
- [ ] Feature documentation
- [ ] FAQ
- [ ] Support contact

---

## 🚨 Risks & Mitigations

| Risk | Impact | Mitigation |
|------|--------|-----------|
| ASAAS API changes | Payments broken | Webhook versioning, monitoring |
| Schema changes mid-sprint | Rework | Final review before Wave 1 |
| Vendor capacity constraints | Slow delivery | Clear estimation, contingency |
| Scope creep | Timeline slips | Strict MVP focus, @pm gate |
| Security vulnerabilities | Data breach | CodeRabbit on every PR, security audit Week 8 |

---

## 📞 Contact & Questions

**Product Manager:** Morgan (@pm)
**Technical Lead:** Aria (@architect)
**Database:** Dara (@data-engineer)
**DevOps:** Gage (@devops)

For epic changes, questions, or scope clarifications, contact Morgan.

---

## Checklist: Epic Approval

- [ ] Database schema validated (Dara ✅)
- [ ] Epics reviewed by @architect (Aria)
- [ ] Epics validated by @po (Pax)
- [ ] Epics ready for @sm story breakdown (River)
- [ ] Dependencies mapped
- [ ] Timeline realistic (8-12 weeks)
- [ ] Success metrics clear
- [ ] Testing strategy defined
- [ ] Documentation plan in place

---

**Status:** ✅ Ready for Story Breakdown → @sm (River)

Formatura SaaS — Development Epics v1.0

Morgan, Product Manager — 3 de Março, 2026
