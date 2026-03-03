# EPIC-2: Contract Lifecycle Management

**Epic ID:** EPIC-2
**Title:** Contract Lifecycle Management
**Status:** Draft
**Created:** 2026-03-03
**Owner:** @pm (Morgan)
**Database:** Dara — Schema complete (tables: contracts, contract_signatures, file_uploads)

---

## 📋 Epic Overview

**Objective:** Implement contract generation, versioning, digital signature tracking, and immutable storage for student/committee/vendor contracts.

**User Value Proposition:**
- **Admin:** Generate contracts from proposals, track signatures, maintain audit trail
- **Student:** Receive contract, review, sign digitally, access signed copy
- **Committee:** Approve contracts before distribution
- **Vendor:** Receive vendor contracts, sign, execute

**Success Metrics:**
- [ ] 100% of contracts digitally signed (no paper)
- [ ] Contract signature time < 24h average
- [ ] Zero unsigned contracts > 30 days
- [ ] 100% audit trail for compliance
- [ ] Contract generation < 5 minutes per event

---

## 🎯 Acceptance Criteria (Epic-Level)

- [x] Database schema ready (EPIC-READY: Dara completed)
- [ ] Contract generation from proposals
- [ ] Contract versioning & immutability
- [ ] Digital signature workflow (DocuSign/manual MVP)
- [ ] Signature status tracking & reminders
- [ ] Contract download & storage
- [ ] Immutable audit trail
- [ ] Multi-signer support

---

## 📊 Scope & Stories

### Story 2.1: Admin Generates Contracts from Approved Quotations
**Points:** 13
**Dependencies:** EPIC-1 approved

**As an** admin
**I want to** generate student/committee/vendor contracts from approved quotations and proposals
**So that** I can formalize agreements and move to payment phase

**Acceptance Criteria:**
- [ ] Admin navigates to "Contracts" section
- [ ] Can generate contracts for: students, committee, vendors
- [ ] Contract template populated from proposal + quotation
- [ ] HTML rendering with logo, dates, amounts
- [ ] Contract hash (SHA-256) for tamper detection
- [ ] Status set to 'draft'
- [ ] Can preview before finalizing
- [ ] Bulk generate for event (all students at once)

**Technical Notes:**
- Tables: contracts, proposals, quotations
- Trigger: Store content_hash (immutable after signing)
- Middleware: Validate admin ownership of event
- Performance: Generate 100 contracts < 60s

---

### Story 2.2: Admin Sends Contract to Signers
**Points:** 8
**Dependencies:** 2.1

**As an** admin
**I want to** send contracts to students/vendors for signature
**So that** I can collect signatures efficiently

**Acceptance Criteria:**
- [ ] Admin clicks "Send for Signature"
- [ ] Contract status changes to 'sent'
- [ ] Email sent to signer with unique link + deadline (14 days)
- [ ] Signer receives email + WhatsApp reminder
- [ ] sent_at timestamp recorded
- [ ] Can resend reminder manually
- [ ] Track open status (opened_at)

**Technical Notes:**
- Tables: contracts, contract_signatures, notifications
- Trigger: Send email + WhatsApp on status update
- Constraint: signature deadline validation
- Audit: Log all sends/resends

---

### Story 2.3: Signer Reviews & Signs Contract (MVP = Manual Upload)
**Points:** 13
**Dependencies:** 2.2

**As a** student/vendor
**I want to** review the contract and sign it
**So that** I can accept the terms and proceed

**Acceptance Criteria:**
- [ ] Signer receives unique link to contract
- [ ] Can view full contract (HTML + PDF download)
- [ ] Can read terms clearly
- [ ] MVP: Upload manually signed PDF
- [ ] File validation: PDF only, < 10MB
- [ ] Signature timestamp recorded
- [ ] Status changes to 'signed'
- [ ] Signed copy stored in file_uploads
- [ ] Signer receives confirmation email

**Technical Notes:**
- Tables: contract_signatures, file_uploads
- File storage: Supabase Storage (MVP)
- Constraint: Prevent re-signing (unique signer per contract)
- Trigger: Log signature event in audit_log
- RLS: Signer can only see own contracts

**Future (Phase 2):**
- Integrate DocuSign for e-signatures
- Biometric signature option

---

### Story 2.4: Admin Tracks Signature Status & Sends Reminders
**Points:** 8
**Dependencies:** 2.3

**As an** admin
**I want to** see which signers have signed and send reminders to unsigned
**So that** I can track completion and follow up

**Acceptance Criteria:**
- [ ] Dashboard shows: signed, pending, overdue contracts
- [ ] Pending list sortable by deadline
- [ ] Can send reminder to unsigned signers
- [ ] Auto-reminder 3 days before deadline
- [ ] After deadline: Mark as overdue, escalate
- [ ] View signer details: name, email, phone, status
- [ ] Bulk reminder for all pending (event-wide)

**Technical Notes:**
- View: contract_status_summary (Dara's schema)
- Trigger: Auto-send reminder 3 days before deadline
- Constraint: reminder_sent_count < 3 (limit spam)
- Middleware: Admin-only, rate limit 50 rem/min

---

### Story 2.5: Admin Executes Signed Contract
**Points:** 5
**Dependencies:** 2.4

**As an** admin
**I want to** mark all signed contracts as 'executed' and proceed to next phase
**So that** we can trigger payment scheduling and vendor contracts

**Acceptance Criteria:**
- [ ] Admin verifies all required signers signed
- [ ] Can manually execute contract (mark complete)
- [ ] Status changes to 'executed'
- [ ] executed_at timestamp recorded
- [ ] Trigger: Auto-create payment schedules (for students)
- [ ] Trigger: Auto-create vendor contracts (for vendors)
- [ ] Email confirmation to all parties
- [ ] Archive from active view

**Technical Notes:**
- Trigger: executed → create payment_schedules + vendor_contracts
- Constraint: All signers must have signed
- Middleware: Verify all contract_signatures.status = 'signed'
- Notification: Send "contract executed" email

---

### Story 2.6: Contract Immutability & Audit
**Points:** 8
**Dependencies:** 2.1

**As a** compliance officer
**I want to** verify that contracts cannot be modified after signing
**So that** we meet legal and regulatory requirements

**Acceptance Criteria:**
- [ ] Signed contracts are read-only (UPDATE blocked)
- [ ] Content hash matches original (tamper detection)
- [ ] All edits logged: who, what, when
- [ ] Deletion prevented (soft delete only via archive)
- [ ] Audit trail shows version history
- [ ] Export audit log for compliance (CSV)
- [ ] 7-year retention enforced

**Technical Notes:**
- Constraint: Contract locked after status='signed'
- Trigger: Prevent UPDATE after signed
- Table: audit_log with immutable INSERT-only
- Middleware: Audit all SELECT on contracts
- Retention: archived_at + 7 year purge schedule

---

### Story 2.7: Contract Download & Storage
**Points:** 5
**Dependencies:** 2.3

**As any** user
**I want to** download my signed contract as PDF
**So that** I have a personal copy for records

**Acceptance Criteria:**
- [ ] Student can download signed contract
- [ ] Vendor can download signed contract
- [ ] Admin can download any contract
- [ ] PDF includes: signature, date, hash, audit trail
- [ ] File naming: contract-{eventId}-{signerId}-{date}.pdf
- [ ] Storage: Supabase Storage with signed URLs (7-day expiry)
- [ ] Download log: Track who downloaded when

**Technical Notes:**
- Table: file_uploads with related_id = contract_id
- Trigger: Log download event
- Security: Signed URLs with 7-day TTL
- RLS: User can only download own contract

---

## 🔗 Database References

**Dara's Schema (Ready):**
- ✅ contracts (id, event_id, proposal_id, content_html, content_hash, status)
- ✅ contract_signatures (id, contract_id, signer_id, status, signed_at, signature_data)
- ✅ file_uploads (id, event_id, category='contract', related_id, file_url)
- ✅ audit_log (id, event_id, action='sign', table_name, record_id, created_at)

---

## 📈 Roadmap

| Phase | Duration | Deliverables |
|-------|----------|--------------|
| **Alpha** | 2 weeks | Stories 2.1, 2.2, 2.3 (manual upload) |
| **Beta** | 1 week | Stories 2.4, 2.5 |
| **Gamma** | 1 week | Stories 2.6, 2.7 (audit + download) |

---

## 🎯 Testing Strategy

- [ ] Unit: Contract generation, hash validation (80% coverage)
- [ ] Integration: Generate → Send → Sign → Execute flow
- [ ] E2E: Admin creates → Student signs → Contract executed
- [ ] RLS: Student cannot see other student contracts
- [ ] Security: CodeRabbit scan for content injection
- [ ] Compliance: Audit trail audit (all actions logged)
- [ ] Performance: Generate 100 contracts < 60s, download < 2s

---

## ⚠️ Risks

| Risk | Mitigation |
|------|-----------|
| Unsigned contracts after 30 days | Auto-escalation + reminders (Story 2.4) |
| Tampered contracts | SHA-256 hash + immutable storage (Story 2.6) |
| Lost signatures | Backup in audit_log + file storage |

---

**Epic Owner:** Morgan (PM)
**Technical Lead:** Aria (Architect)
**Database:** Dara (Data Engineer)

---

*Formatura SaaS — EPIC-2: Contract Lifecycle Management*
