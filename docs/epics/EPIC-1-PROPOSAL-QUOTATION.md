# EPIC-1: Proposal & Quotation System

**Epic ID:** EPIC-1
**Title:** Proposal & Quotation System
**Status:** Draft
**Created:** 2026-03-03
**Owner:** @pm (Morgan)
**Database:** Dara — Schema complete (tables: proposals, quotations, vendors, quotation_requests)

---

## 📋 Epic Overview

**Objective:** Implement the proposal and quotation management system allowing admins to create proposal templates, request quotations from vendors, and track vendor responses.

**User Value Proposition:**
- **Admin:** Create reusable proposal templates, request competitive quotes from multiple vendors
- **Committee:** Review vendor proposals and pricing
- **Vendor:** Submit quotations for events and track status

**Success Metrics:**
- [ ] Admins can create 5+ proposal templates per event
- [ ] Vendors can submit quotations within 24h of RFQ
- [ ] 80% faster vendor selection vs. manual process
- [ ] System stores 100% of quotation history for audit

---

## 🎯 Acceptance Criteria (Epic-Level)

- [x] Database schema ready (EPIC-READY: Dara completed)
- [ ] Proposal creation UI (admin)
- [ ] Proposal versioning & editable fields
- [ ] Quotation request workflow (RFQ)
- [ ] Vendor quotation submission (portal)
- [ ] Admin quotation approval & comparison
- [ ] Audit trail for all quotations
- [ ] Full-text search on proposals & quotations

---

## 📊 Scope & Stories

### Story 1.1: Admin Creates Proposal Template
**Points:** 8
**Dependencies:** Database ready

**As an** admin
**I want to** create a reusable proposal template for the event
**So that** I can standardize formatting and reduce manual work

**Acceptance Criteria:**
- [ ] Admin navigates to "Proposals" section
- [ ] Can create new proposal with title, description, version
- [ ] Can add dynamic sections (name, content, field_type)
- [ ] Sections are editable/locked based on business rules
- [ ] Proposal saved with status='draft'
- [ ] Can preview rendered proposal (HTML)

**Technical Notes:**
- Tables: proposals, proposal_sections
- RLS: Admin of event only
- Triggers: updated_at auto-update

---

### Story 1.2: Admin Sends Proposal to Committee
**Points:** 5
**Dependencies:** 1.1

**As an** admin
**I want to** send the proposal to committee members for review
**So that** I can gather feedback before finalizing

**Acceptance Criteria:**
- [ ] Admin clicks "Send to Committee"
- [ ] Proposal status changes to 'sent'
- [ ] Committee members receive notification (email/WhatsApp)
- [ ] sent_at timestamp recorded
- [ ] History log shows who sent when

**Technical Notes:**
- Tables: proposals, notifications
- Trigger: send notification on status update
- Middleware: Verify admin_id = auth.uid()

---

### Story 1.3: Committee Reviews Proposal
**Points:** 5
**Dependencies:** 1.2

**As a** committee member
**I want to** review the proposal and provide feedback
**So that** we can ensure all details are accurate

**Acceptance Criteria:**
- [ ] Committee sees proposal in "Review" panel
- [ ] Can comment inline on sections
- [ ] Can mark as reviewed
- [ ] Comments stored for audit
- [ ] Status tracked (reviewed, approved, rejected)

**Technical Notes:**
- RLS: Committee members of event
- New table (Proposal 2.0): proposal_comments
- Audit trigger: Log all changes

---

### Story 1.4: Admin Requests Quotations from Vendors
**Points:** 8
**Dependencies:** Database ready

**As an** admin
**I want to** request quotations from multiple vendors for specific services
**So that** I can compare pricing and select best options

**Acceptance Criteria:**
- [ ] Admin creates quotation_request (title, category, deadline, description)
- [ ] Can select multiple vendors at once
- [ ] RFQ email sent to vendors with download link
- [ ] Status tracked (pending, submitted, approved, rejected, expired)
- [ ] Deadline enforcement (display: overdue if past date)
- [ ] Only open quotation_requests can receive submissions

**Technical Notes:**
- Tables: quotation_requests, quotations
- Enum: quotation_status (pending, submitted, approved, rejected, expired)
- Trigger: Auto-send emails to vendors
- Middleware: Verify admin ownership

---

### Story 1.5: Vendor Submits Quotation
**Points:** 8
**Dependencies:** 1.4

**As a** vendor
**I want to** submit my quotation for an RFQ
**So that** I can compete for the event business

**Acceptance Criteria:**
- [ ] Vendor receives unique link to RFQ
- [ ] Can submit quotation with amount, description, file upload
- [ ] Can see their submission status
- [ ] Cannot submit after deadline
- [ ] Submission timestamp recorded (immutable)
- [ ] File validation: PDF only, < 10MB

**Technical Notes:**
- Tables: quotations, file_uploads
- RLS: Vendor can only see own quotations
- Constraint: deadline check
- Trigger: Notify admin of new submission

---

### Story 1.6: Admin Compares & Approves Quotations
**Points:** 8
**Dependencies:** 1.5

**As an** admin
**I want to** see all quotations side-by-side and approve/reject
**So that** I can select the best vendor for each service

**Acceptance Criteria:**
- [ ] Quotation comparison view (table: vendor, amount, description)
- [ ] Lowest price highlighted
- [ ] Admin can approve one quotation per RFQ
- [ ] Approval triggers contract creation workflow
- [ ] Rejection reason logged
- [ ] Audit trail: who approved, when, for which vendor

**Technical Notes:**
- View: quotation_status_view (Dara's schema)
- Trigger: approved → create vendor_contract entry
- Email: Notify approved vendor + rejected vendors
- RLS: Admin-only access

---

### Story 1.7: Quotation Audit & Search
**Points:** 5
**Dependencies:** 1.6

**As an** admin
**I want to** search quotations by vendor, amount, date, and see full history
**So that** I can track all pricing decisions for compliance

**Acceptance Criteria:**
- [ ] Full-text search on vendor name, service category
- [ ] Filter by status, amount range, date range
- [ ] Export quotations to CSV
- [ ] View version history (amendments, resubmissions)
- [ ] Audit log shows: who accessed, when, changes made

**Technical Notes:**
- Index: idx_quotations_request_status, idx_quotations_amount
- View: quotation_status_view (using Dara's schema)
- Trigger: Log all SELECT (audit_log)
- Middleware: Rate limit: 100 req/min per user

---

## 🔗 Database References

**Dara's Schema (Ready):**
- ✅ proposals (id, event_id, title, status, version, created_at, updated_at)
- ✅ proposal_sections (id, proposal_id, section_name, content, field_type)
- ✅ quotation_requests (id, event_id, title, category, deadline, is_open)
- ✅ quotations (id, quotation_request_id, vendor_id, amount, status, submitted_at)
- ✅ vendors (id, company_name, document_number, service_categories)
- ✅ file_uploads (id, event_id, category, file_url, related_type, related_id)

**New Tables (Proposal 2.0):**
- proposal_comments (id, proposal_id, commenter_id, content, created_at)

---

## 📈 Roadmap

| Phase | Duration | Deliverables |
|-------|----------|--------------|
| **Alpha** | 2 weeks | Stories 1.1, 1.2, 1.4, 1.5 |
| **Beta** | 1 week | Stories 1.3, 1.6 |
| **Gamma** | 1 week | Story 1.7 (audit + search) |
| **Launch** | - | All stories complete |

---

## 🎯 Testing Strategy

- [ ] Unit tests: Proposal creation, validation (80% coverage)
- [ ] Integration tests: RFQ → Quotation workflow
- [ ] E2E tests: Admin creates RFQ → Vendor submits → Admin approves
- [ ] RLS tests: Vendor cannot see other vendor quotations
- [ ] Performance: 1000 quotations load < 500ms
- [ ] Audit: All actions logged to audit_log

---

## ⚠️ Risks & Mitigations

| Risk | Impact | Mitigation |
|------|--------|-----------|
| Vendors submit expired quotations | Incorrect pricing data | Deadline validation in DB (CHECK constraint) |
| Admin cannot compare prices easily | Slow decision-making | Quotation comparison view (Story 1.6) |
| No audit trail for compliance | Regulatory risk | Audit triggers (Story 1.7) |
| File uploads too large | Server load | File size limit: 10MB (validation) |

---

## 🚀 Launch Readiness Checklist

- [ ] All 7 stories completed and reviewed
- [ ] RLS policies blocking cross-vendor access ✅
- [ ] Audit triggers logging all changes ✅
- [ ] Performance tests passing (< 500ms)
- [ ] Integration tests with ASAAS webhook (Phase 2)
- [ ] Documentation complete
- [ ] Security audit: CodeRabbit approval
- [ ] @qa gate: PASS

---

**Epic Owner:** Morgan (PM)
**Technical Lead:** Aria (Architect)
**Database:** Dara (Data Engineer)

---

*Formatura SaaS — EPIC-1: Proposal & Quotation System*
