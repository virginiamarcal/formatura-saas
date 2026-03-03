# Product Requirements Document (PRD)
## Formatura SaaS Platform v1.0

**Date:** March 2, 2026
**Product Manager:** Morgan
**Status:** Draft
**Project:** Formatura SaaS — Graduation Event Management Platform

---

## 1. Executive Summary

**Formatura SaaS** is a comprehensive platform that streamlines the complete lifecycle of graduation event organization and management for schools (primary, secondary, and higher education). The platform facilitates:

- **Sales & Proposal Management** — Automated quotation distribution to vendors
- **Contract Management** — Digital contracts for students, committees, and vendors with e-signature
- **Payment Administration** — Installment tracking, student payment dashboards, and automated reminders via ASAAS
- **Financial Accounting** — Real-time reconciliation, vendor payment tracking, and comprehensive financial reporting
- **Stakeholder Communication** — Seamless collaboration between admin, committees, students, and vendors

**Target Users:**
- Admin (event planning company staff)
- Graduation Committees (group representatives)
- Individual Students
- Event Vendors/Suppliers

---

## 2. Problem Statement

Graduation event planning is traditionally **fragmented and manual**:

- ❌ Multiple communication channels (email, WhatsApp, phone) create confusion
- ❌ Paper contracts and signatures are slow and unverifiable
- ❌ Manual payment tracking and reconciliation is error-prone
- ❌ Scattered vendor quotations and proposals lack organization
- ❌ No visibility for students on payment status or event progress
- ❌ Financial accounting is labor-intensive and difficult to audit
- ❌ Payment collection is inefficient without automated reminders

---

## 3. Product Vision

**Formatura SaaS** centralizes the entire graduation event process into a single, intuitive platform where:

- **Admin** can manage proposals, contracts, vendors, and finances in one dashboard
- **Committees** can review proposals, sign contracts, and track progress transparently
- **Students** can download contracts, pay installments, and see real-time payment status
- **Vendors** can submit quotations and receive payment notifications
- **Everyone** has visibility, accountability, and automated reminders

---

## 4. Core Features & User Flows

### 4.1 Admin Panel (Event Planning Company)

#### 4.1.1 Vendor/Supplier Management

**Feature: Supplier Database**
- Database of suppliers organized by service category (catering, photography, decoration, DJ, venue, etc.)
- Store supplier contact info, WhatsApp numbers, email
- Track historical quotations and pricing

**Feature: Event Quotation System**
- Create event with basic info: type, date, number of guests, venue
- Select service categories to request quotations from
- System automatically sends pre-formatted WhatsApp messages to all selected vendors
- Vendors click "ANNEXE YOUR PROPOSAL" button, upload quotation file
- Admin receives organized quotations in dedicated panel for comparison and analysis

**Feature: Proposal Management**
- Upload proposal template (PDF/Word with editable fields)
- Panel with editable fields to customize proposal quickly
- Generate proposal and save
- Auto-create Committee Panel login/password upon proposal generation
- Send proposal link to committee

#### 4.1.2 Contract Management

**Feature: Student & Committee Data Collection**
- Upon committee agreement to contract, display form for student data entry
- Required fields: NAME, ADDRESS, WHATSAPP, EMAIL (optional)
- Committee uploads all student data at once
- Admin receives data and generates contracts

**Feature: Contract Generation & E-Signature**
- Admin selects contract template (student contract or committee contract if applicable)
- System auto-generates:
  - Individual student login/password
  - Individual student panel
  - Committee tracking panel
- Admin sends WhatsApp message (pre-formatted) with login/password to each student
- Student receives message, logs in, downloads contract, signs digitally, uploads signed contract back
- Admin receives signed contract with status update visible immediately
- Admin confirms all students signed, clicks "CONTRACT FORMALIZED — IN PROGRESS"

#### 4.1.3 Payment & Financial Management

**Feature: Payment Administration via ASAAS**
- Monthly invoice generation for each student's installment
- 15-day advance notice before payment due date
- Automated payment reminders sent to students
- ASAAS integration for payment collection and reconciliation
- Payment status displayed in real-time on student dashboards

**Feature: Receipt Verification & Reconciliation**
- AI-powered authenticity verification of receipt uploads (flag suspicious receipts with alert)
- Color-coded receipt status (red=pending verification, green=verified)
- Monthly bank statement upload for cross-reference verification
- Admin marks receipt as "received/verified"
- Until verified, receipt remains "Awaiting Verification" on student dashboard

**Feature: Financial Accounting & Reporting**
- Track payments by service and by student
- Administration fee collection AFTER all monthly payments verified
- Separate tracking: student payments vs. vendor payments vs. admin fees
- Generate accounting report at any time showing:
  - Total received
  - Total paid out (by vendor)
  - Admin fees collected
  - Payment dates and references
  - Outstanding amounts

#### 4.1.4 Timeline & Calendar Management

**Feature: Event Timeline**
- Calendar/timeline view for each contract
- Auto-populated with key dates: payment deadlines, vendor contract deadlines
- Manual alerts and reminders for admin (e.g., "Pay vendor X on Y date")
- Potential Google Calendar integration for sync
- Color-coded alerts for upcoming deadlines

---

### 4.2 Committee Panel

**Access:** Login/password separate from student accounts

**Features:**
- View proposal document
- Upload student data for contract generation (Name, Address, WhatsApp, Email)
- Sign contracts (if applicable)
- Approve vendor contracts ("DE ACORDO" button)
- View real-time payment status by student (visual breakdown)
- Receive admin alerts and notifications
- View financial summary (showing services contracted and amounts)
- Download financial reports at any time

**Accountability Mechanism:**
- Each student has assigned numeric ID (fixed alphabetically, never re-ordered even if students withdraw)
- Payment status visible to all committee members simultaneously
- Visual "slice/column" display where each student's name appears as a "slice"
- As months complete, slices turn green; unpaid slices remain red
- Creates peer accountability ("social pressure") for payment collection

---

### 4.3 Student Panel

**Access:** Individual login/password generated per student

**Features:**

**Contracts & Documents:**
- Download contract document
- Digital signature capability
- Upload signed contract back to system
- Status indicator: pending signature → signed

**Payment Dashboard:**
- Numeric & graphical display of installment schedule
- Each installment shows: amount, due date, payment status
- Color-coded: red (unpaid) → green (paid)
- Installment references by student ID number (for transparency on ASAAS fees)
- **ASAAS Fee Disclosure:** Clearly display that payment processing fees apply and will be added to each installment

**Payment Receipt:**
- Upon payment, upload receipt of payment to dedicated section
- Status: pending verification → verified by admin
- Real-time status update after admin verification

**Event Countdown & Accountability:**
- Countdown timer to graduation date
- Visual display of all students' payment status (e.g., "slice" column with each student's name)
- Color-coded by status: red (unpaid) → green (paid)
- Monthly visual completion: as months pass, the column fills with green
- Creates transparency and peer accountability

**Notifications:**
- 15-day advance notice of payment due date
- Payment reminders as due date approaches
- Admin notifications about contract status, vendor updates, etc.

---

### 4.4 Vendor/Supplier Panel

**Access:** Login/password for vendor representatives

**Features:**
- Receive quotation requests (via WhatsApp with link)
- Submit proposal/quotation document
- Access contracts (review, sign, return signed contract)
- Receive payment notifications (for each monthly installment of their service)
- Upload receipt of payment (quitação) confirmation
- Communicate with admin via alert/message system

---

## 5. Technical & Business Rules

### 5.1 Numbering & Referencing

- **Student ID:** Assigned numerically in alphabetical order (1, 2, 3, ... N)
- **ID is immutable:** Even if a student withdraws, their number stays assigned to that name
- **Purpose:** Use student ID in invoice references for easy reconciliation and verification (e.g., "Invoice 001-2026-MAR-001" for Student 1, March 2026, Installment 1)

### 5.2 Payment Processing

- **Invoicing:** ASAAS automatically generates monthly invoices on schedule
- **Advance Notice:** 15 days before due date
- **Reminders:** Automated reminders as due date approaches
- **Fee Disclosure:** Students must see ASAAS processing fees clearly stated
- **Reconciliation:** Admin verifies payment against ASAAS receipt and bank statement

### 5.3 Financial Flows

**Student Payments:**
1. Student pays installment via ASAAS invoice
2. Funds deposit in escrow/admin bank account
3. Student uploads receipt to panel
4. Admin verifies authenticity (AI + manual if flagged)
5. Admin confirms receipt against bank statement
6. Status changes to "Verified" on student dashboard

**Vendor Payments:**
1. Admin contractually commits to pay vendor
2. At agreed date, admin initiates payment to vendor
3. Vendor uploads receipt of payment
4. Admin records payment in accounting system
5. Fee tracking: if vendor is paid before all student installments collected, note variance

**Admin Fee Collection:**
- Admin fee (e.g., 10% of total contract value) is collected ONLY AFTER all monthly student payments are verified
- Separate invoice issued to committee/student pool
- Clear breakdown in reporting: "Administration Fee: X% of Y = Z"

### 5.4 Contract Flow

1. Admin creates proposal with vendor quotations
2. Committee accesses proposal, reviews
3. Committee approves and clicks "We want to formalize contract"
4. Committee enters all student data (name, address, WhatsApp, email)
5. Admin receives data, generates contracts
6. System sends WhatsApp to each student with login/password
7. Student signs and uploads signed contract
8. Admin verifies all signed, clicks "CONTRACT FORMALIZED"
9. Committee approves each vendor contract ("DE ACORDO")
10. Admin finalizes vendor contracts, sends to vendor, tracks signatures
11. Payments begin per schedule

---

## 6. Key Integrations

| Integration | Purpose | Notes |
|-------------|---------|-------|
| **ASAAS** | Automated invoicing & payment collection | Monthly invoice generation, payment tracking |
| **WhatsApp API/Messaging** | Student & vendor notifications | Pre-formatted messages, login credentials |
| **Google Calendar** (optional) | Timeline sync | Integration for admin calendar |
| **Email** | Formal communications & alerts | Contract notifications, financial reports |
| **Digital Signature** (e.g., DocuSign integration) | E-signature capability | Sign contracts within platform |
| **AI Verification** | Receipt authenticity verification | Flag suspicious receipts for manual review |
| **PDF Generation** | Dynamic proposal & contract generation | Template-based rendering |

---

## 7. Success Metrics & KPIs

| Metric | Target | Owner |
|--------|--------|-------|
| **Payment Collection Rate** | >95% on-time payment completion | Admin |
| **Contract Signing Time** | <7 days from generation to all signed | Admin |
| **Admin Time Savings** | 40% reduction vs. manual process | Admin/PM |
| **Payment Reconciliation Accuracy** | 100% account verification | Admin |
| **User Adoption** | 100% of committees & students active | Admin/PM |
| **Support Tickets** | <5 per month per contract | Admin/PM |
| **Platform Uptime** | 99.5% | DevOps |

---

## 8. User Stories (High-Level)

### Epic 1: Proposal & Quotation Management
- US-1.1: Admin creates event and sends quotation requests to vendors
- US-1.2: Vendors submit proposals, admin organizes and compares
- US-1.3: Admin generates proposal from template and sends to committee

### Epic 2: Contract Lifecycle
- US-2.1: Committee reviews proposal and approves
- US-2.2: Committee enters student data
- US-2.3: Admin generates contracts, system sends WhatsApp to students
- US-2.4: Students sign contracts digitally
- US-2.5: Admin verifies all signed and formalizes

### Epic 3: Payment & Financial Management
- US-3.1: ASAAS generates monthly invoices
- US-3.2: Students receive payment reminders
- US-3.3: Students upload payment receipts
- US-3.4: Admin verifies receipts (AI + manual)
- US-3.5: Admin reconciles payments against bank statement
- US-3.6: Admin collects administration fee after verification

### Epic 4: Transparency & Accountability
- US-4.1: Student sees payment dashboard with status
- US-4.2: Student sees countdown timer to graduation
- US-4.3: Student sees visual "slice" display of all students' payment status
- US-4.4: Committee sees real-time financial summary

### Epic 5: Vendor Management
- US-5.1: Vendor receives quotation request via WhatsApp
- US-5.2: Vendor submits proposal
- US-5.3: Vendor signs contract
- US-5.4: Vendor receives payment notification
- US-5.5: Vendor uploads payment receipt

### Epic 6: Reporting & Compliance
- US-6.1: Generate financial accounting report (income, expenses, by vendor)
- US-6.2: Generate payment reconciliation report
- US-6.3: Export report for committee delivery

---

## 9. Complexity Assessment

**Estimated Complexity: HIGH (16-18 points)**

| Dimension | Score (1-5) | Notes |
|-----------|-------------|-------|
| **Scope** | 5 | 6 distinct user roles, 20+ features, multi-contract management |
| **Integration** | 5 | ASAAS, WhatsApp, Google Calendar, AI verification, digital signatures |
| **Infrastructure** | 4 | Database design (contracts, payments, users), real-time updates, webhooks |
| **Knowledge** | 4 | Domain-specific (financial accounting, e-signature, payment processing) |
| **Risk** | 5 | Payment system criticality, financial data sensitivity, compliance (receipts/contracts) |

**Total: 23 points** — COMPLEX CLASS

---

## 10. MVP (Minimum Viable Product) Definition

**Phase 1 MVP (Core Foundation):**
- Admin panel with event creation
- Committee panel with proposal access
- Student panel with contract & payment dashboard
- ASAAS integration for invoice generation
- WhatsApp notification (basic text messages)
- Manual receipt verification (AI verification deferred to Phase 2)
- Basic financial reporting

**Phase 2 (Post-MVP Enhancements):**
- AI receipt verification
- Google Calendar integration
- Advanced timeline/calendar UI
- Vendor panel (full feature set)
- Digital signature integration
- Advanced reporting & exports

---

## 11. Acceptance Criteria

### AC-1: Platform Launches with 1+ contracts
- Admin can create event, send quotations, generate proposal
- Committee can access proposal and approve
- Students can download, sign, and track contracts
- System can generate invoices via ASAAS
- Students can upload payment receipts

### AC-2: Financial Accuracy
- 100% of student payments reconciled against bank statement
- Admin fee calculated correctly
- Financial report matches bank records

### AC-3: User Experience
- All workflows complete in <10 minutes per action
- <2% user support tickets
- 100% contract signature rate

---

## 12. Out of Scope (Future Consideration)

- Multi-language support (Phase 2)
- Mobile app (native iOS/Android) — Phase 2+
- Advanced analytics/dashboards — Phase 2
- Payment reversal/refund workflow — Phase 2
- Vendor performance ratings — Phase 2

---

## 13. Glossary

| Term | Definition |
|------|-----------|
| **Committee** | Group representative(s) authorized to sign contracts on behalf of the graduation class |
| **Student** | Individual participant in the graduation event who must sign contract and pay installments |
| **Admin** | Event planning company staff managing the entire contract lifecycle |
| **Vendor/Supplier** | Service provider (catering, photography, etc.) contracted for the event |
| **Installment** | Monthly payment due date and amount for the student's share |
| **Escrow** | Admin's bank account holding student payments until verification and distribution |
| **Quitação** | Receipt confirming vendor payment in full |

---

## Document History

| Version | Date | Author | Status |
|---------|------|--------|--------|
| v1.0 | 2026-03-02 | Morgan (PM) | Draft |

---

**Next Steps:**
1. Stakeholder review & feedback
2. Complexity assessment & team assignment
3. Epic breakdown & story creation via @sm
4. Technical architecture design via @architect
5. Development sprint planning
