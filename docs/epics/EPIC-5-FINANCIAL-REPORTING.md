# EPIC-5: Financial Reporting & Analytics

**Epic ID:** EPIC-5
**Title:** Financial Reporting & Admin Dashboard
**Status:** Draft
**Created:** 2026-03-03
**Owner:** @pm (Morgan)

---

## 📋 Epic Overview

**Objective:** Build admin dashboard with financial reports, KPIs, and data visualization.

**User Value Proposition:**
- **Admin:** Real-time financial overview, vendor payments, profitability analysis, forecasting

**Success Metrics:**
- [ ] Dashboard loads < 2s (1000 events)
- [ ] 100% accuracy on financial totals
- [ ] Reports exportable as PDF/CSV

---

## 📊 Scope & Stories

### Story 5.1: Financial Summary Dashboard
**Points:** 8
**Dependencies:** EPIC-3

- [ ] Total collected vs. scheduled amount
- [ ] Payment by status (pending, paid, overdue)
- [ ] Top 10 students by amount due
- [ ] Collection trend (last 30 days)
- [ ] Admin fee calculation & visualization

### Story 5.2: Vendor & Expense Tracking
**Points:** 8
**Dependencies:** EPIC-3

- [ ] Total vendor contracts value
- [ ] Vendor payment status (paid, scheduled, overdue)
- [ ] Vendor performance (delivery, quality)
- [ ] Expense breakdown by category

### Story 5.3: Financial Reports & Export
**Points:** 8
**Dependencies:** 5.1, 5.2

- [ ] Generate PDF financial report (event summary)
- [ ] Export to CSV (payments, expenses, audit)
- [ ] Tax/compliance report for accounting
- [ ] Signed PDF (tamper-proof hash)

### Story 5.4: Real-time Analytics (Supabase Realtime)
**Points:** 5
**Dependencies:** 5.1

- [ ] Dashboard updates in real-time
- [ ] Payment notifications (live badge)
- [ ] New signatures tracked live
- [ ] Vendor payout notifications

---

## 🎯 Acceptance Criteria

- [x] Database views ready (Dara: event_financial_summary)
- [ ] Dashboard renders < 2s
- [ ] Charts use Chart.js (responsive)
- [ ] Export functionality working
- [ ] RLS: Admin sees only own event data
- [ ] Performance: Queries < 500ms

---

**Epic Owner:** Morgan (PM)

*Formatura SaaS — EPIC-5: Financial Reporting*
