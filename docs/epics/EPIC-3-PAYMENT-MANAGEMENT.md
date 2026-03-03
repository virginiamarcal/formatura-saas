# EPIC-3: Payment Management System

**Epic ID:** EPIC-3
**Title:** Payment Management & ASAAS Integration
**Status:** Draft
**Created:** 2026-03-03
**Owner:** @pm (Morgan)
**Database:** Dara — Schema complete (tables: payment_schedules, invoices, payments, vendor_payments)

---

## 📋 Epic Overview

**Objective:** Implement payment scheduling, invoice generation via ASAAS, payment tracking, receipt verification, and vendor payouts.

**User Value Proposition:**
- **Admin:** Create payment schedules, monitor collection, reconcile ASAAS, pay vendors
- **Student:** View due dates, pay via link, upload receipt
- **Vendor:** Receive payment, see payment status

**Success Metrics:**
- [ ] 95% on-time payment collection (measured)
- [ ] < 5min from payment confirmation to student notification
- [ ] 100% audit trail for financial transactions
- [ ] Zero unreconciled payments > 7 days
- [ ] ASAAS webhook reliability 99.9%

---

## 🎯 Acceptance Criteria

- [x] Database schema ready (EPIC-READY: Dara completed)
- [ ] Payment schedule creation (monthly installments)
- [ ] Automatic invoice generation via ASAAS
- [ ] Payment tracking & status updates
- [ ] Receipt verification workflow
- [ ] Vendor payment workflow
- [ ] Financial audit trail (immutable)
- [ ] ASAAS webhook integration

---

## 📊 Scope & Stories

### Story 3.1: Admin Creates Payment Schedule
**Points:** 8
**Dependencies:** EPIC-2 (contract executed)

**As an** admin
**I want to** create a payment schedule for students (monthly installments)
**So that** I can collect funds for the event

**Acceptance Criteria:**
- [ ] Admin selects event and students
- [ ] Sets: total_amount, number_of_installments, start_date
- [ ] System calculates: installment_amount (validates total = count * amount)
- [ ] First due_date set (e.g., 30 days from start)
- [ ] Schedule saved with is_active=true
- [ ] Can preview: all installment dates
- [ ] Bulk create for all students at once

**Technical Notes:**
- Table: payment_schedules
- Constraint: total_amount = installment_amount * count
- Trigger: Auto-generate invoices (Story 3.2)
- Middleware: Admin-only, event ownership verification

---

### Story 3.2: Auto-generate Invoices from ASAAS
**Points:** 13
**Dependencies:** 3.1

**As the** system
**I want to** automatically create invoices on ASAAS for each installment
**So that** students receive payment links automatically

**Acceptance Criteria:**
- [ ] Trigger: After payment_schedule created → POST to ASAAS API
- [ ] ASAAS returns: invoice_id, payment_link
- [ ] Invoice stored: amount, due_date, asaas_id, payment_link
- [ ] Invoice status: 'sent'
- [ ] ASAAS webhook creates payment record (on payment.confirmed)
- [ ] Error handling: Retry 3x if ASAAS unavailable
- [ ] Log: All ASAAS interactions for audit

**Technical Notes:**
- Table: invoices with asaas_id (unique)
- API: ASAAS webhooks → POST /webhooks/asaas
- Retry: Bull queue for failed webhook processing
- Idempotency: asaas_id prevents duplicate invoices

---

### Story 3.3: ASAAS Webhook: Payment Received
**Points:** 8
**Dependencies:** 3.2

**As the** system
**I want to** process payment.confirmed webhook from ASAAS
**So that** payment records are updated automatically

**Acceptance Criteria:**
- [ ] Webhook validates ASAAS signature
- [ ] Webhook idempotent (prevent 2x processing)
- [ ] Create payment record: amount, method, reference_id, paid_at
- [ ] Update invoice status: 'confirmed'
- [ ] Insert financial_transaction audit record (immutable)
- [ ] Send student notification (email + WhatsApp)
- [ ] Admin dashboard updates real-time (Supabase Realtime)
- [ ] Failed webhook logged, alerts sent

**Technical Notes:**
- Endpoint: POST /webhooks/asaas
- Validation: HMAC-SHA256 signature check
- Idempotency: reference_id deduplication
- Trigger: Log to financial_transactions (immutable)
- Notification: Use notification service (Story 3.6)

---

### Story 3.4: Student Upload Payment Receipt (Manual Path)
**Points:** 5
**Dependencies:** 3.2

**As a** student
**I want to** upload a payment receipt if ASAAS payment fails
**So that** admin can manually verify my payment

**Acceptance Criteria:**
- [ ] Student navigates to "Payments" panel
- [ ] Can upload PDF/image of receipt
- [ ] File validation: PDF/PNG/JPG, < 5MB
- [ ] Receipt status: 'pending'
- [ ] Notification sent to admin
- [ ] Can retry upload (replace file)

**Technical Notes:**
- Table: payment_receipts
- Storage: Supabase Storage
- Trigger: Notify admin on upload
- RLS: Student can only upload own receipt

---

### Story 3.5: Admin Verifies Receipts & Marks Payment
**Points:** 8
**Dependencies:** 3.4

**As an** admin
**I want to** verify uploaded receipts and mark payments as verified
**So that** manual payments are recorded

**Acceptance Criteria:**
- [ ] Admin sees pending receipts in dashboard
- [ ] Can view receipt image (zoom, rotate)
- [ ] Can approve or reject (with reason)
- [ ] Approval: Creates payment record, marks 'verified'
- [ ] Rejection: Student notified, can re-upload
- [ ] Verified payment: Send student confirmation
- [ ] Audit: Log approval + admin_id + timestamp

**Technical Notes:**
- Table: payment_receipts with reviewed_by_id
- Trigger: Create payment record on approval
- Notification: Email + WhatsApp on approval/rejection
- Middleware: Admin-only, rate limit 100 req/min

---

### Story 3.6: Payment Notifications & Reminders
**Points:** 8
**Dependencies:** 3.3

**As the** system
**I want to** send payment reminders and confirmations
**So that** students stay informed of their payment status

**Acceptance Criteria:**
- [ ] Invoice generated → Email + WhatsApp (payment link)
- [ ] 7 days before due → Reminder notification
- [ ] Payment confirmed → Confirmation notification
- [ ] 3 days overdue → Escalation notification
- [ ] Rate limit: Max 1 per student per day per type
- [ ] All notifications logged (notifications table)
- [ ] WhatsApp: Use approved templates only

**Technical Notes:**
- Table: notifications
- Trigger: Send on invoice creation, payment update, overdue
- Queue: Bull for async sending
- Template: Use TEMPLATES env var (3 approved by WhatsApp)
- Middleware: Rate limit enforcement

---

### Story 3.7: Admin Reconciliation & Vendor Payout
**Points:** 13
**Dependencies:** 3.3

**As an** admin
**I want to** reconcile payments with bank statement and pay vendors
**So that** vendor contracts are fulfilled

**Acceptance Criteria:**
- [ ] Admin reconciliation view: expected vs. actual receipts
- [ ] Upload bank statement (CSV)
- [ ] System matches: ASAAS payments vs. bank
- [ ] Discrepancies flagged for manual review
- [ ] Create vendor_payments (automated or manual)
- [ ] Batch payout scheduling
- [ ] Payment method: Bank transfer, PIX, check
- [ ] Audit trail: Every reconciliation logged

**Technical Notes:**
- Table: vendor_payments, financial_transactions
- Bank CSV parser: Detect amount, date, reference
- Matching: Fuzzy match on amount + date (±2 days)
- Trigger: Log reconciliation event
- Constraint: vendor_payment.scheduled_date >= today

---

### Story 3.8: Financial Audit Trail & Compliance
**Points:** 8
**Dependencies:** 3.7

**As a** compliance officer
**I want to** view immutable financial transaction log
**So that** we meet auditing and regulatory requirements

**Acceptance Criteria:**
- [ ] All payments logged: type, amount, user_id, timestamp
- [ ] Cannot delete financial_transactions (immutable)
- [ ] Export for external audit (PDF, signed)
- [ ] 7-year retention enforced
- [ ] Dashboard: Total collected, pending, overdue
- [ ] Reports: Cash flow, payment trends
- [ ] Admin fee calculation automated & logged

**Technical Notes:**
- Table: financial_transactions (INSERT-only)
- View: event_financial_summary
- Trigger: Log all payment operations
- Export: Signed PDF with hash for authenticity
- Retention: Archived at year 8 (S3)

---

## 🔗 Database References

**Dara's Schema (Ready):**
- ✅ payment_schedules, invoices, payments
- ✅ payment_receipts, vendor_payments
- ✅ financial_transactions (immutable)
- ✅ notifications

---

## 📈 Roadmap

| Phase | Duration | Deliverables |
|-------|----------|--------------|
| **Alpha** | 2 weeks | Stories 3.1, 3.2, 3.3 (ASAAS MVP) |
| **Beta** | 1 week | Stories 3.4, 3.5 (receipts) |
| **Gamma** | 1 week | Stories 3.6, 3.7, 3.8 (notifications, reconciliation) |

---

**Epic Owner:** Morgan (PM)
**Technical Lead:** Aria (Architect)
**Database:** Dara (Data Engineer)

---

*Formatura SaaS — EPIC-3: Payment Management*
