# EPIC-4: Student Dashboard & Portal

**Epic ID:** EPIC-4
**Title:** Student Dashboard & Self-Service Portal
**Status:** Draft
**Created:** 2026-03-03
**Owner:** @pm (Morgan)

---

## 📋 Epic Overview

**Objective:** Build student-facing dashboard showing contracts, payments, and event information.

**User Value Proposition:**
- **Student:** Track payment schedule, view/sign contracts, download receipts, upload proof of payment

**Success Metrics:**
- [ ] 95% student engagement (log in at least once)
- [ ] < 2min to find payment status
- [ ] 100% self-service (no admin help needed)

---

## 📊 Scope & Stories

### Story 4.1: Student Login & Session
**Points:** 5
**Dependencies:** Database ready

- [ ] Supabase Auth integration (email/password)
- [ ] Persistent session (httpOnly cookie)
- [ ] Password reset flow
- [ ] RLS automatic (student sees only own data)

### Story 4.2: Payment Dashboard
**Points:** 8
**Dependencies:** EPIC-3

- [ ] Shows: total due, next due date, payment history
- [ ] Link to pay via ASAAS
- [ ] View installment schedule (table/timeline)
- [ ] Mark receipt as paid (upload proof)
- [ ] Download receipt PDF
- [ ] **Mobile responsive design:**
  - [ ] Works on iPhone, Android, tablets (320px-768px screens)
  - [ ] Touch-friendly buttons (minimum 48px tap targets)
  - [ ] Optimized layout for portrait/landscape
  - [ ] Fast load time on 3G (< 3s)
  - [ ] Tested on: iPhone SE, iPhone 12, Samsung Galaxy S20, iPad

### Story 4.3: Contract Review & Sign
**Points:** 8
**Dependencies:** EPIC-2

- [ ] View all contracts assigned to student
- [ ] Download contract PDF
- [ ] Upload signed copy
- [ ] Track signature status
- [ ] Receive signature reminders
- [ ] **Mobile responsive design:**
  - [ ] Works on iPhone, Android, tablets (320px-768px screens)
  - [ ] Touch-friendly buttons (minimum 48px tap targets)
  - [ ] Optimized layout for portrait/landscape
  - [ ] Fast load time on 3G (< 3s)
  - [ ] Tested on: iPhone SE, iPhone 12, Samsung Galaxy S20, iPad

### Story 4.4: Event Information
**Points:** 5
**Dependencies:** Database ready

- [ ] View event details: date, venue, total_budget
- [ ] Committee members contact info
- [ ] Event documents (proposals, quotations summary)
- [ ] Important dates timeline

---

## 🎯 Acceptance Criteria

- [x] Database schema ready
- [ ] Student can log in securely
- [ ] Dashboard shows all payment info
- [ ] Can view and sign contracts
- [ ] Can upload payment receipts
- [ ] Mobile-responsive design
- [ ] Real-time payment updates (Supabase Realtime)

---

**Epic Owner:** Morgan (PM)

*Formatura SaaS — EPIC-4: Student Dashboard*
