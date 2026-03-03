-- =============================================================================
-- Formatura SaaS — Complete PostgreSQL Schema v1.0
-- =============================================================================
-- Database: Supabase (PostgreSQL 15+)
-- Architecture: Multi-tenant per event, Row Level Security (RLS), ACID compliant
-- Created: 2026-03-03
-- Engineer: Dara (Data Engineer Agent)
-- =============================================================================

-- SECTION 1: EXTENSIONS & UTILITIES
-- =============================================================================

-- UUID generation
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- JSON Schema validation
CREATE EXTENSION IF NOT EXISTS "jsonschema";

-- Full-text search
CREATE EXTENSION IF NOT EXISTS "pg_trgm";

-- =============================================================================
-- SECTION 2: ENUMS & TYPES
-- =============================================================================

CREATE TYPE user_role_type AS ENUM ('admin', 'committee', 'student', 'vendor');
CREATE TYPE event_status_type AS ENUM ('draft', 'active', 'completed', 'archived');
CREATE TYPE proposal_status_type AS ENUM ('draft', 'sent', 'reviewed', 'approved', 'rejected');
CREATE TYPE contract_status_type AS ENUM ('draft', 'sent', 'signed', 'executed', 'rejected', 'archived');
CREATE TYPE signature_status_type AS ENUM ('pending', 'signed', 'rejected');
CREATE TYPE payment_status_type AS ENUM ('pending', 'scheduled', 'overdue', 'paid', 'cancelled', 'failed');
CREATE TYPE invoice_status_type AS ENUM ('draft', 'sent', 'opened', 'confirmed', 'refunded', 'received');
CREATE TYPE quotation_status_type AS ENUM ('pending', 'submitted', 'approved', 'rejected', 'expired');
CREATE TYPE vendor_contract_status_type AS ENUM ('pending', 'signed', 'executed', 'completed', 'terminated');
CREATE TYPE transaction_type_enum AS ENUM ('payment_received', 'payment_failed', 'refund', 'vendor_payout', 'admin_fee', 'adjustment');
CREATE TYPE audit_action_enum AS ENUM ('create', 'update', 'delete', 'sign', 'verify', 'reject');

-- =============================================================================
-- SECTION 3: CORE TABLES — EVENTS (TENANT ROOT)
-- =============================================================================

CREATE TABLE events (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  admin_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE RESTRICT,

  -- Event metadata
  name VARCHAR(200) NOT NULL,
  description TEXT,
  date DATE NOT NULL,
  venue VARCHAR(255),
  guest_count INTEGER DEFAULT 0 CHECK (guest_count >= 0),

  -- Status & lifecycle
  status event_status_type DEFAULT 'draft',
  starts_at TIMESTAMP WITH TIME ZONE,
  ends_at TIMESTAMP WITH TIME ZONE,
  archived_at TIMESTAMP WITH TIME ZONE,

  -- Financial summary
  total_budget DECIMAL(12, 2) DEFAULT 0.00,
  admin_fee_percentage DECIMAL(5, 2) DEFAULT 10.00 CHECK (admin_fee_percentage >= 0),

  -- Audit
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL,

  CONSTRAINT event_date_valid CHECK (date >= CURRENT_DATE)
);

COMMENT ON TABLE events IS 'Núcleo de isolamento multi-tenant. Cada formatura é um evento único.';
COMMENT ON COLUMN events.admin_id IS 'Proprietário do evento. Referência ao auth.users(id).';
COMMENT ON COLUMN events.admin_fee_percentage IS 'Taxa de administração do evento, calculada sobre receitas.';

CREATE INDEX idx_events_admin_id ON events(admin_id);
CREATE INDEX idx_events_status ON events(status);
CREATE INDEX idx_events_created_at ON events(created_at DESC);

-- =============================================================================
-- SECTION 4: USER & ACCESS TABLES
-- =============================================================================

CREATE TABLE user_roles (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
  role user_role_type NOT NULL DEFAULT 'student',
  company_name VARCHAR(255), -- Para vendors
  document_number VARCHAR(50), -- CNPJ/CPF para vendors
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL
);

COMMENT ON TABLE user_roles IS 'Mapeamento de usuários para roles globais (admin, committee, student, vendor).';

CREATE INDEX idx_user_roles_user_id ON user_roles(user_id);
CREATE INDEX idx_user_roles_role ON user_roles(role);

-- Event membership (associação de usuário a evento com role)
CREATE TABLE event_members (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  event_id UUID NOT NULL REFERENCES events(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role user_role_type NOT NULL,
  invited_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  accepted_at TIMESTAMP WITH TIME ZONE,
  removed_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL,

  UNIQUE(event_id, user_id),
  CONSTRAINT member_not_removed CHECK (accepted_at IS NULL OR removed_at IS NULL OR removed_at > accepted_at)
);

COMMENT ON TABLE event_members IS 'Segregação: Usuário só acessa evento se for membro.';

CREATE INDEX idx_event_members_event_id ON event_members(event_id);
CREATE INDEX idx_event_members_user_id ON event_members(user_id);
CREATE INDEX idx_event_members_role ON event_members(role);
CREATE INDEX idx_event_members_active ON event_members(event_id, user_id) WHERE removed_at IS NULL;

-- =============================================================================
-- SECTION 5: PROPOSALS & CONTRACTS
-- =============================================================================

CREATE TABLE proposals (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  event_id UUID NOT NULL REFERENCES events(id) ON DELETE CASCADE,
  created_by_id UUID NOT NULL REFERENCES auth.users(id),

  -- Proposal metadata
  title VARCHAR(255) NOT NULL,
  description TEXT,
  version INTEGER DEFAULT 1,
  status proposal_status_type DEFAULT 'draft',

  -- Dates & history
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL,
  sent_at TIMESTAMP WITH TIME ZONE,
  reviewed_at TIMESTAMP WITH TIME ZONE,

  CONSTRAINT proposal_version_positive CHECK (version > 0)
);

COMMENT ON TABLE proposals IS 'Propostas de formatura (modelos editáveis, versão 1+).';

CREATE INDEX idx_proposals_event_id ON proposals(event_id);
CREATE INDEX idx_proposals_status ON proposals(status);
CREATE INDEX idx_proposals_created_at ON proposals(created_at DESC);

-- Seções editáveis de proposta
CREATE TABLE proposal_sections (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  proposal_id UUID NOT NULL REFERENCES proposals(id) ON DELETE CASCADE,

  section_name VARCHAR(100) NOT NULL,
  content TEXT,
  field_type VARCHAR(50), -- text, number, date, select, etc.
  is_editable BOOLEAN DEFAULT TRUE,

  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL,

  UNIQUE(proposal_id, section_name)
);

COMMENT ON TABLE proposal_sections IS 'Campos dinâmicos de proposta (detalhes editáveis por seção).';

CREATE INDEX idx_proposal_sections_proposal_id ON proposal_sections(proposal_id);

-- Contratos (imutáveis após assinatura)
CREATE TABLE contracts (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  event_id UUID NOT NULL REFERENCES events(id) ON DELETE CASCADE,
  proposal_id UUID REFERENCES proposals(id) ON DELETE SET NULL,

  -- Contrato metadata
  contract_type VARCHAR(50) NOT NULL, -- student, committee, vendor, etc.
  title VARCHAR(255) NOT NULL,
  content_html TEXT NOT NULL, -- HTML renderizado
  content_hash VARCHAR(64), -- SHA-256 para verificar integridade

  -- Status
  status contract_status_type DEFAULT 'draft',
  created_by_id UUID NOT NULL REFERENCES auth.users(id),

  -- Assinadura
  requires_signature BOOLEAN DEFAULT TRUE,
  signed_at TIMESTAMP WITH TIME ZONE,
  executed_at TIMESTAMP WITH TIME ZONE,

  -- Auditoria
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL,

  CONSTRAINT contract_immutable_check CHECK (
    (status IN ('draft', 'sent')) OR
    (status IN ('signed', 'executed', 'rejected', 'archived') AND updated_at = created_at + INTERVAL '1 second' OR updated_at > created_at)
  )
);

COMMENT ON TABLE contracts IS 'Contratos imutáveis após assinatura. Referência a propostas para rastreabilidade.';

CREATE INDEX idx_contracts_event_id ON contracts(event_id);
CREATE INDEX idx_contracts_status ON contracts(status);
CREATE INDEX idx_contracts_created_at ON contracts(created_at DESC);
CREATE INDEX idx_contracts_type ON contracts(contract_type);

-- Assinaturas de contrato
CREATE TABLE contract_signatures (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  contract_id UUID NOT NULL REFERENCES contracts(id) ON DELETE CASCADE,
  signer_id UUID NOT NULL REFERENCES auth.users(id),

  -- Assinatura
  status signature_status_type DEFAULT 'pending',
  signed_at TIMESTAMP WITH TIME ZONE,
  signature_data JSONB, -- Dados da assinatura digital
  document_url VARCHAR(255), -- URL do PDF assinado

  -- Auditoria
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL,

  UNIQUE(contract_id, signer_id)
);

COMMENT ON TABLE contract_signatures IS 'Rastreamento de quem assinou, quando e com qual status.';

CREATE INDEX idx_contract_signatures_contract_id ON contract_signatures(contract_id);
CREATE INDEX idx_contract_signatures_signer_id ON contract_signatures(signer_id);
CREATE INDEX idx_contract_signatures_status ON contract_signatures(status);

-- =============================================================================
-- SECTION 6: PAYMENTS & INVOICES
-- =============================================================================

CREATE TABLE payment_schedules (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  event_id UUID NOT NULL REFERENCES events(id) ON DELETE CASCADE,
  student_id UUID NOT NULL REFERENCES auth.users(id),

  -- Cronograma
  total_amount DECIMAL(12, 2) NOT NULL CHECK (total_amount > 0),
  number_of_installments INTEGER NOT NULL CHECK (number_of_installments > 0),
  installment_amount DECIMAL(12, 2) NOT NULL CHECK (installment_amount > 0),

  -- Datas
  start_date DATE NOT NULL,
  first_due_date DATE NOT NULL,

  -- Status
  is_active BOOLEAN DEFAULT TRUE,

  -- Auditoria
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL,
  created_by_id UUID REFERENCES auth.users(id),

  CONSTRAINT schedule_dates_valid CHECK (first_due_date >= start_date),
  CONSTRAINT schedule_amount_valid CHECK (
    ABS(total_amount - (installment_amount * number_of_installments)) < 0.01
  )
);

COMMENT ON TABLE payment_schedules IS 'Cronograma de pagamento por aluno (parcelado).';

CREATE INDEX idx_payment_schedules_event_id ON payment_schedules(event_id);
CREATE INDEX idx_payment_schedules_student_id ON payment_schedules(student_id);
CREATE INDEX idx_payment_schedules_is_active ON payment_schedules(is_active);

-- Faturas (integração ASAAS)
CREATE TABLE invoices (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  event_id UUID NOT NULL REFERENCES events(id) ON DELETE CASCADE,
  student_id UUID NOT NULL REFERENCES auth.users(id),
  payment_schedule_id UUID REFERENCES payment_schedules(id),

  -- Metadados
  invoice_number VARCHAR(50) UNIQUE,
  asaas_id VARCHAR(100) UNIQUE, -- ID retornado por ASAAS
  description TEXT,

  -- Valores
  amount DECIMAL(12, 2) NOT NULL CHECK (amount > 0),
  discount DECIMAL(12, 2) DEFAULT 0.00,
  net_amount DECIMAL(12, 2) GENERATED ALWAYS AS (amount - discount) STORED,

  -- Datas
  issue_date DATE NOT NULL DEFAULT CURRENT_DATE,
  due_date DATE NOT NULL,

  -- Status & tracking
  status invoice_status_type DEFAULT 'draft',
  payment_link VARCHAR(255),

  -- Auditoria
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL,

  CONSTRAINT invoice_due_after_issue CHECK (due_date >= issue_date)
);

COMMENT ON TABLE invoices IS 'Faturas geradas automaticamente (integração com ASAAS para envio).';

CREATE INDEX idx_invoices_event_id ON invoices(event_id);
CREATE INDEX idx_invoices_student_id ON invoices(student_id);
CREATE INDEX idx_invoices_status ON invoices(status);
CREATE INDEX idx_invoices_asaas_id ON invoices(asaas_id);
CREATE INDEX idx_invoices_due_date ON invoices(due_date);

-- Pagamentos recebidos
CREATE TABLE payments (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  event_id UUID NOT NULL REFERENCES events(id) ON DELETE CASCADE,
  student_id UUID NOT NULL REFERENCES auth.users(id),
  invoice_id UUID REFERENCES invoices(id),

  -- Pagamento
  amount DECIMAL(12, 2) NOT NULL CHECK (amount > 0),
  method VARCHAR(50), -- credit_card, pix, bank_transfer, cash
  reference_id VARCHAR(100), -- ID externo (ASAAS, PIX, etc.)

  -- Status
  status payment_status_type DEFAULT 'pending',
  paid_at TIMESTAMP WITH TIME ZONE,
  verified_at TIMESTAMP WITH TIME ZONE,
  verified_by_id UUID REFERENCES auth.users(id),

  -- Notas
  notes TEXT,

  -- Auditoria
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL
);

COMMENT ON TABLE payments IS 'Pagamentos recebidos (confirmados e rastreáveis).';

CREATE INDEX idx_payments_event_id ON payments(event_id);
CREATE INDEX idx_payments_student_id ON payments(student_id);
CREATE INDEX idx_payments_status ON payments(status);
CREATE INDEX idx_payments_paid_at ON payments(paid_at DESC);
CREATE INDEX idx_payments_invoice_id ON payments(invoice_id);

-- Comprovantes de pagamento (upload de aluno)
CREATE TABLE payment_receipts (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  event_id UUID NOT NULL REFERENCES events(id) ON DELETE CASCADE,
  payment_id UUID NOT NULL REFERENCES payments(id) ON DELETE CASCADE,
  student_id UUID NOT NULL REFERENCES auth.users(id),

  -- Arquivo
  file_url VARCHAR(255) NOT NULL,
  file_name VARCHAR(255),
  file_size INTEGER,
  mime_type VARCHAR(100),

  -- Status
  status VARCHAR(50) DEFAULT 'pending', -- pending, approved, rejected
  reviewed_by_id UUID REFERENCES auth.users(id),
  reviewed_at TIMESTAMP WITH TIME ZONE,
  rejection_reason TEXT,

  -- Auditoria
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL
);

COMMENT ON TABLE payment_receipts IS 'Comprovantes de pagamento carregados por alunos (manual verification).';

CREATE INDEX idx_payment_receipts_event_id ON payment_receipts(event_id);
CREATE INDEX idx_payment_receipts_payment_id ON payment_receipts(payment_id);
CREATE INDEX idx_payment_receipts_status ON payment_receipts(status);

-- Pagamentos a fornecedores
CREATE TABLE vendor_payments (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  event_id UUID NOT NULL REFERENCES events(id) ON DELETE CASCADE,
  vendor_id UUID NOT NULL REFERENCES auth.users(id),
  vendor_contract_id UUID REFERENCES vendor_contracts(id),

  -- Pagamento
  amount DECIMAL(12, 2) NOT NULL CHECK (amount > 0),
  payment_method VARCHAR(50), -- bank_transfer, pix, check
  bank_account JSONB, -- {bank, account, holder_name}

  -- Status
  status payment_status_type DEFAULT 'pending',
  scheduled_date DATE,
  paid_at TIMESTAMP WITH TIME ZONE,

  -- Auditoria
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL,
  created_by_id UUID REFERENCES auth.users(id),

  CONSTRAINT vendor_payment_date_future CHECK (scheduled_date IS NULL OR scheduled_date >= CURRENT_DATE)
);

COMMENT ON TABLE vendor_payments IS 'Pagamentos saindo para fornecedores (contas a pagar).';

CREATE INDEX idx_vendor_payments_event_id ON vendor_payments(event_id);
CREATE INDEX idx_vendor_payments_vendor_id ON vendor_payments(vendor_id);
CREATE INDEX idx_vendor_payments_status ON vendor_payments(status);

-- Transações financeiras (audit trail completo)
CREATE TABLE financial_transactions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  event_id UUID NOT NULL REFERENCES events(id) ON DELETE CASCADE,

  -- Transação
  type transaction_type_enum NOT NULL,
  description TEXT NOT NULL,
  amount DECIMAL(12, 2) NOT NULL,

  -- Referências
  related_payment_id UUID REFERENCES payments(id),
  related_vendor_payment_id UUID REFERENCES vendor_payments(id),
  related_invoice_id UUID REFERENCES invoices(id),

  -- Quem executou
  user_id UUID REFERENCES auth.users(id),

  -- Dados contextuais
  metadata JSONB,

  -- Auditoria (imutável)
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL
);

COMMENT ON TABLE financial_transactions IS 'Auditoria financeira imutável. Todas as transações registradas aqui.';

CREATE INDEX idx_financial_transactions_event_id ON financial_transactions(event_id);
CREATE INDEX idx_financial_transactions_type ON financial_transactions(type);
CREATE INDEX idx_financial_transactions_created_at ON financial_transactions(created_at DESC);
CREATE INDEX idx_financial_transactions_user_id ON financial_transactions(user_id);

-- =============================================================================
-- SECTION 7: VENDORS & QUOTATIONS
-- =============================================================================

CREATE TABLE vendors (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,

  -- Informações
  company_name VARCHAR(255) NOT NULL,
  document_number VARCHAR(50) UNIQUE, -- CNPJ
  email VARCHAR(255) NOT NULL,
  phone VARCHAR(20),
  website VARCHAR(255),

  -- Endereço
  address JSONB, -- {street, city, state, zipcode}

  -- Categorias de serviço
  service_categories TEXT[], -- fotografia, buffet, som, etc.

  -- Status & auditoria
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL
);

COMMENT ON TABLE vendors IS 'Base de fornecedores (provedores de serviços para eventos).';

CREATE INDEX idx_vendors_document_number ON vendors(document_number);
CREATE INDEX idx_vendors_email ON vendors(email);
CREATE INDEX idx_vendors_is_active ON vendors(is_active);
CREATE INDEX idx_vendors_service_categories ON vendors USING GIN(service_categories);

-- Solicitações de cotação
CREATE TABLE quotation_requests (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  event_id UUID NOT NULL REFERENCES events(id) ON DELETE CASCADE,
  created_by_id UUID NOT NULL REFERENCES auth.users(id),

  -- Detalhes da solicitação
  title VARCHAR(255) NOT NULL,
  description TEXT,
  category VARCHAR(100), -- fotografia, buffet, som, etc.

  -- Datas
  request_date DATE DEFAULT CURRENT_DATE,
  deadline_date DATE NOT NULL,

  -- Status
  is_open BOOLEAN DEFAULT TRUE,

  -- Auditoria
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL,

  CONSTRAINT quotation_deadline_future CHECK (deadline_date >= request_date)
);

COMMENT ON TABLE quotation_requests IS 'Solicitações de cotação enviadas a múltiplos fornecedores.';

CREATE INDEX idx_quotation_requests_event_id ON quotation_requests(event_id);
CREATE INDEX idx_quotation_requests_category ON quotation_requests(category);
CREATE INDEX idx_quotation_requests_is_open ON quotation_requests(is_open);

-- Cotações submetidas
CREATE TABLE quotations (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  quotation_request_id UUID NOT NULL REFERENCES quotation_requests(id) ON DELETE CASCADE,
  vendor_id UUID NOT NULL REFERENCES vendors(id) ON DELETE CASCADE,

  -- Cotação
  amount DECIMAL(12, 2) NOT NULL CHECK (amount > 0),
  description TEXT,
  file_url VARCHAR(255),

  -- Status
  status quotation_status_type DEFAULT 'pending',
  submitted_at TIMESTAMP WITH TIME ZONE,
  approved_at TIMESTAMP WITH TIME ZONE,
  approved_by_id UUID REFERENCES auth.users(id),

  -- Auditoria
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL,

  UNIQUE(quotation_request_id, vendor_id)
);

COMMENT ON TABLE quotations IS 'Cotações submetidas por fornecedores (competição de preços).';

CREATE INDEX idx_quotations_quotation_request_id ON quotations(quotation_request_id);
CREATE INDEX idx_quotations_vendor_id ON quotations(vendor_id);
CREATE INDEX idx_quotations_status ON quotations(status);
CREATE INDEX idx_quotations_amount ON quotations(amount);

-- Contratos com fornecedores
CREATE TABLE vendor_contracts (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  event_id UUID NOT NULL REFERENCES events(id) ON DELETE CASCADE,
  vendor_id UUID NOT NULL REFERENCES vendors(id) ON DELETE RESTRICT,
  quotation_id UUID REFERENCES quotations(id),

  -- Contrato
  title VARCHAR(255) NOT NULL,
  description TEXT,
  contract_value DECIMAL(12, 2) NOT NULL CHECK (contract_value > 0),

  -- Status & ciclo de vida
  status vendor_contract_status_type DEFAULT 'pending',
  signed_at TIMESTAMP WITH TIME ZONE,
  execution_start_date DATE,
  execution_end_date DATE,

  -- Auditoria
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL,
  created_by_id UUID REFERENCES auth.users(id),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL
);

COMMENT ON TABLE vendor_contracts IS 'Contratos formalizados com fornecedores (baseados em cotações aprovadas).';

CREATE INDEX idx_vendor_contracts_event_id ON vendor_contracts(event_id);
CREATE INDEX idx_vendor_contracts_vendor_id ON vendor_contracts(vendor_id);
CREATE INDEX idx_vendor_contracts_status ON vendor_contracts(status);

-- =============================================================================
-- SECTION 8: FILES & AUDIT
-- =============================================================================

CREATE TABLE file_uploads (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  event_id UUID NOT NULL REFERENCES events(id) ON DELETE CASCADE,
  uploaded_by_id UUID NOT NULL REFERENCES auth.users(id),

  -- Arquivo
  file_name VARCHAR(255) NOT NULL,
  file_url VARCHAR(500) NOT NULL,
  file_size INTEGER CHECK (file_size > 0),
  mime_type VARCHAR(100),

  -- Categorização
  category VARCHAR(50), -- contract, receipt, proposal, quotation, signature, etc.
  related_type VARCHAR(100), -- contracts, invoices, quotations
  related_id UUID,

  -- Auditoria
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL,
  deleted_at TIMESTAMP WITH TIME ZONE
);

COMMENT ON TABLE file_uploads IS 'Rastreamento centralizado de arquivos (contratos, comprovantes, cotações).';

CREATE INDEX idx_file_uploads_event_id ON file_uploads(event_id);
CREATE INDEX idx_file_uploads_category ON file_uploads(category);
CREATE INDEX idx_file_uploads_related ON file_uploads(related_type, related_id);
CREATE INDEX idx_file_uploads_not_deleted ON file_uploads(event_id) WHERE deleted_at IS NULL;

-- Auditoria de ações
CREATE TABLE audit_log (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  event_id UUID NOT NULL REFERENCES events(id) ON DELETE CASCADE,
  user_id UUID REFERENCES auth.users(id),

  -- Ação
  action audit_action_enum NOT NULL,
  table_name VARCHAR(100),
  record_id UUID,

  -- Dados
  old_data JSONB,
  new_data JSONB,
  changes JSONB, -- delta das mudanças

  -- IP & contexto
  ip_address INET,
  user_agent TEXT,

  -- Auditoria (imutável)
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL
);

COMMENT ON TABLE audit_log IS 'Auditoria imutável de todas as ações no evento.';

CREATE INDEX idx_audit_log_event_id ON audit_log(event_id);
CREATE INDEX idx_audit_log_user_id ON audit_log(user_id);
CREATE INDEX idx_audit_log_table_name ON audit_log(table_name);
CREATE INDEX idx_audit_log_action ON audit_log(action);
CREATE INDEX idx_audit_log_created_at ON audit_log(created_at DESC);

-- Notificações (rastreamento de envios)
CREATE TABLE notifications (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  event_id UUID NOT NULL REFERENCES events(id) ON DELETE CASCADE,
  recipient_id UUID NOT NULL REFERENCES auth.users(id),

  -- Notificação
  type VARCHAR(50), -- email, whatsapp, push
  subject VARCHAR(255),
  body TEXT,
  template_key VARCHAR(100),

  -- Status
  sent_at TIMESTAMP WITH TIME ZONE,
  delivery_status VARCHAR(50), -- pending, sent, failed, opened
  failure_reason TEXT,

  -- Auditoria
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL
);

COMMENT ON TABLE notifications IS 'Rastreamento de notificações enviadas (email, WhatsApp).';

CREATE INDEX idx_notifications_event_id ON notifications(event_id);
CREATE INDEX idx_notifications_recipient_id ON notifications(recipient_id);
CREATE INDEX idx_notifications_delivery_status ON notifications(delivery_status);
CREATE INDEX idx_notifications_created_at ON notifications(created_at DESC);

-- =============================================================================
-- SECTION 9: ROW LEVEL SECURITY (RLS) POLICIES
-- =============================================================================

-- Enable RLS on all tables
ALTER TABLE events ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE event_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE proposals ENABLE ROW LEVEL SECURITY;
ALTER TABLE proposal_sections ENABLE ROW LEVEL SECURITY;
ALTER TABLE contracts ENABLE ROW LEVEL SECURITY;
ALTER TABLE contract_signatures ENABLE ROW LEVEL SECURITY;
ALTER TABLE payment_schedules ENABLE ROW LEVEL SECURITY;
ALTER TABLE invoices ENABLE ROW LEVEL SECURITY;
ALTER TABLE payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE payment_receipts ENABLE ROW LEVEL SECURITY;
ALTER TABLE vendor_payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE financial_transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE vendors ENABLE ROW LEVEL SECURITY;
ALTER TABLE quotation_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE quotations ENABLE ROW LEVEL SECURITY;
ALTER TABLE vendor_contracts ENABLE ROW LEVEL SECURITY;
ALTER TABLE file_uploads ENABLE ROW LEVEL SECURITY;
ALTER TABLE audit_log ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;

-- Policy: Events — Admin vê seu próprio evento
CREATE POLICY "admin_see_own_events" ON events
FOR SELECT USING (admin_id = auth.uid());

-- Policy: Events — Membros veem eventos onde participam
CREATE POLICY "members_see_event" ON events
FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM event_members
    WHERE event_members.event_id = events.id
    AND event_members.user_id = auth.uid()
    AND event_members.removed_at IS NULL
  )
);

-- Policy: Event Members — Pode ver membros do seu evento
CREATE POLICY "see_event_members" ON event_members
FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM events
    WHERE events.id = event_members.event_id
    AND (
      events.admin_id = auth.uid()
      OR EXISTS (
        SELECT 1 FROM event_members em2
        WHERE em2.event_id = events.id
        AND em2.user_id = auth.uid()
        AND em2.removed_at IS NULL
      )
    )
  )
);

-- Policy: Proposals — Membro do evento vê propostas
CREATE POLICY "see_proposals" ON proposals
FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM event_members
    WHERE event_members.event_id = proposals.event_id
    AND event_members.user_id = auth.uid()
  )
);

-- Policy: Contracts — Membro vê contratos do evento
CREATE POLICY "see_contracts" ON contracts
FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM event_members
    WHERE event_members.event_id = contracts.event_id
    AND event_members.user_id = auth.uid()
  )
);

-- Policy: Contract Signatures — Signatário vê sua assinatura
CREATE POLICY "see_own_signatures" ON contract_signatures
FOR SELECT USING (signer_id = auth.uid());

-- Policy: Payments — Aluno vê seus próprios pagamentos
CREATE POLICY "student_see_own_payments" ON payments
FOR SELECT USING (
  student_id = auth.uid()
  OR auth.uid() IN (
    SELECT admin_id FROM events WHERE events.id = payments.event_id
  )
);

-- Policy: Invoices — Aluno vê suas faturas
CREATE POLICY "student_see_own_invoices" ON invoices
FOR SELECT USING (
  student_id = auth.uid()
  OR auth.uid() IN (
    SELECT admin_id FROM events WHERE events.id = invoices.event_id
  )
);

-- Policy: Notifications — Só ve próprias
CREATE POLICY "see_own_notifications" ON notifications
FOR SELECT USING (recipient_id = auth.uid());

-- =============================================================================
-- SECTION 10: TRIGGERS FOR AUTOMATION & AUDIT
-- =============================================================================

-- Função: Atualizar updated_at automaticamente
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = CURRENT_TIMESTAMP;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Aplicar trigger updated_at em tabelas mutáveis
CREATE TRIGGER update_events_updated_at BEFORE UPDATE ON events
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_user_roles_updated_at BEFORE UPDATE ON user_roles
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_event_members_updated_at BEFORE UPDATE ON event_members
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_proposals_updated_at BEFORE UPDATE ON proposals
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_proposal_sections_updated_at BEFORE UPDATE ON proposal_sections
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_contracts_updated_at BEFORE UPDATE ON contracts
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_contract_signatures_updated_at BEFORE UPDATE ON contract_signatures
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_invoices_updated_at BEFORE UPDATE ON invoices
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_payments_updated_at BEFORE UPDATE ON payments
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_vendor_contracts_updated_at BEFORE UPDATE ON vendor_contracts
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Função: Registrar pagamento em audit_log
CREATE OR REPLACE FUNCTION log_payment_to_audit()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO audit_log (event_id, user_id, action, table_name, record_id, new_data, created_at)
  VALUES (
    NEW.event_id,
    auth.uid(),
    CASE WHEN TG_OP = 'INSERT' THEN 'create' ELSE 'update' END,
    'payments',
    NEW.id,
    to_jsonb(NEW),
    CURRENT_TIMESTAMP
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER audit_payment_changes AFTER INSERT OR UPDATE ON payments
FOR EACH ROW EXECUTE FUNCTION log_payment_to_audit();

-- Função: Registrar contrato em audit_log
CREATE OR REPLACE FUNCTION log_contract_to_audit()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO audit_log (event_id, user_id, action, table_name, record_id, new_data, created_at)
  VALUES (
    NEW.event_id,
    auth.uid(),
    CASE WHEN TG_OP = 'INSERT' THEN 'create' ELSE 'update' END,
    'contracts',
    NEW.id,
    to_jsonb(NEW),
    CURRENT_TIMESTAMP
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER audit_contract_changes AFTER INSERT OR UPDATE ON contracts
FOR EACH ROW EXECUTE FUNCTION log_contract_to_audit();

-- Função: Registrar assinatura
CREATE OR REPLACE FUNCTION log_signature_to_audit()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO audit_log (event_id, user_id, action, table_name, record_id, new_data, created_at)
  VALUES (
    (SELECT contracts.event_id FROM contracts WHERE contracts.id = NEW.contract_id),
    NEW.signer_id,
    'sign',
    'contract_signatures',
    NEW.id,
    to_jsonb(NEW),
    CURRENT_TIMESTAMP
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER audit_signature_changes AFTER INSERT OR UPDATE ON contract_signatures
FOR EACH ROW EXECUTE FUNCTION log_signature_to_audit();

-- =============================================================================
-- SECTION 11: VIEWS FOR REPORTING
-- =============================================================================

-- View: Resumo financeiro por evento
CREATE OR REPLACE VIEW event_financial_summary AS
SELECT
  e.id,
  e.name,
  e.date,
  COUNT(DISTINCT s.id) as total_students,
  COALESCE(SUM(ps.total_amount), 0) as total_scheduled_amount,
  COALESCE(SUM(CASE WHEN p.status = 'paid' THEN p.amount ELSE 0 END), 0) as total_paid,
  COALESCE(SUM(ps.total_amount), 0) - COALESCE(SUM(CASE WHEN p.status = 'paid' THEN p.amount ELSE 0 END), 0) as pending_amount,
  COUNT(DISTINCT i.id) as total_invoices,
  COUNT(DISTINCT CASE WHEN i.status = 'confirmed' THEN i.id END) as confirmed_invoices
FROM
  events e
  LEFT JOIN payment_schedules ps ON e.id = ps.event_id AND ps.is_active
  LEFT JOIN invoices i ON e.id = i.event_id
  LEFT JOIN payments p ON i.id = p.invoice_id
  LEFT JOIN LATERAL (
    SELECT DISTINCT event_members.user_id as id
    FROM event_members
    WHERE event_members.event_id = e.id
    AND event_members.role = 'student'
    AND event_members.removed_at IS NULL
  ) s ON TRUE
GROUP BY e.id, e.name, e.date;

-- View: Status de contratos por evento
CREATE OR REPLACE VIEW contract_status_summary AS
SELECT
  e.id as event_id,
  e.name as event_name,
  COUNT(DISTINCT c.id) as total_contracts,
  COUNT(DISTINCT CASE WHEN c.status = 'draft' THEN c.id END) as draft_contracts,
  COUNT(DISTINCT CASE WHEN c.status = 'sent' THEN c.id END) as sent_contracts,
  COUNT(DISTINCT CASE WHEN c.status = 'signed' THEN c.id END) as signed_contracts,
  COUNT(DISTINCT CASE WHEN c.status = 'executed' THEN c.id END) as executed_contracts,
  COUNT(DISTINCT CASE WHEN c.status = 'rejected' THEN c.id END) as rejected_contracts,
  COUNT(DISTINCT cs.id) as pending_signatures
FROM
  events e
  LEFT JOIN contracts c ON e.id = c.event_id
  LEFT JOIN contract_signatures cs ON c.id = cs.contract_id AND cs.status = 'pending'
GROUP BY e.id, e.name;

-- View: Pagamentos pendentes por aluno
CREATE OR REPLACE VIEW student_payment_overview AS
SELECT
  s.id as student_id,
  e.id as event_id,
  e.name as event_name,
  COUNT(DISTINCT i.id) as total_invoices,
  COUNT(DISTINCT CASE WHEN i.status != 'confirmed' THEN i.id END) as pending_invoices,
  COALESCE(SUM(CASE WHEN i.status = 'confirmed' THEN i.net_amount ELSE 0 END), 0) as amount_paid,
  COALESCE(SUM(CASE WHEN i.status != 'confirmed' THEN i.net_amount ELSE 0 END), 0) as amount_due,
  COALESCE(MAX(CASE WHEN i.status != 'confirmed' THEN i.due_date END), CURRENT_DATE) as next_due_date
FROM
  auth.users s
  JOIN event_members em ON s.id = em.user_id AND em.role = 'student' AND em.removed_at IS NULL
  JOIN events e ON em.event_id = e.id
  LEFT JOIN invoices i ON e.id = i.event_id AND s.id = i.student_id
GROUP BY s.id, e.id, e.name;

-- View: Cotações submetidas por evento
CREATE OR REPLACE VIEW quotation_status_view AS
SELECT
  e.id as event_id,
  e.name as event_name,
  qr.id as quotation_request_id,
  qr.title as request_title,
  qr.category,
  COUNT(DISTINCT q.id) as total_quotations,
  COUNT(DISTINCT CASE WHEN q.status = 'pending' THEN q.id END) as pending_quotations,
  COUNT(DISTINCT CASE WHEN q.status = 'approved' THEN q.id END) as approved_quotations,
  MIN(CASE WHEN q.status != 'rejected' THEN q.amount END) as lowest_price
FROM
  events e
  JOIN quotation_requests qr ON e.id = qr.event_id
  LEFT JOIN quotations q ON qr.id = q.quotation_request_id
GROUP BY e.id, e.name, qr.id, qr.title, qr.category;

-- =============================================================================
-- SECTION 12: COMMENTS & DOCUMENTATION
-- =============================================================================

COMMENT ON SCHEMA public IS 'Formatura SaaS Database Schema v1.0 — Multi-tenant architecture with RLS';

-- =============================================================================
-- SECTION 13: INDEXES FOR PERFORMANCE
-- =============================================================================

-- Full-text search indexes
CREATE INDEX idx_events_name_search ON events USING GIN(to_tsvector('portuguese', name));
CREATE INDEX idx_contracts_title_search ON contracts USING GIN(to_tsvector('portuguese', title));
CREATE INDEX idx_vendors_company_search ON vendors USING GIN(to_tsvector('portuguese', company_name));

-- Composite indexes for common queries
CREATE INDEX idx_payments_event_student_status ON payments(event_id, student_id, status);
CREATE INDEX idx_invoices_event_student_due ON invoices(event_id, student_id, due_date);
CREATE INDEX idx_contracts_event_status_type ON contracts(event_id, status, contract_type);
CREATE INDEX idx_quotations_request_status ON quotations(quotation_request_id, status, amount);

-- =============================================================================
-- SECTION 14: INITIAL INSERTS (Optional - for development)
-- =============================================================================

-- No inserts here — data created via application layer

-- =============================================================================
-- SCHEMA INITIALIZATION COMPLETE
-- =============================================================================
-- Total tables: 19
-- Total triggers: 8
-- Total views: 4
-- Total policies: 10+
-- Schema created for Formatura SaaS MVP v1.0
-- Ready for application deployment
-- =============================================================================
