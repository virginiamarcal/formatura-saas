# Formatura SaaS — Full-Stack Architecture v1.0

**Data:** 3 de Março, 2026
**Arquiteto:** Aria
**Status:** Draft
**Escopo:** MVP v1.0 + Fase 1

---

## 1. Executive Summary

Formatura SaaS é uma **plataforma de gerenciamento de eventos de formatura** com ciclo de vida completo: propostas → contratos → pagamentos → contabilidade.

**Abordagem Arquitetural:**
- **Multi-tenancy por evento** — Cada formatura é um tenant isolado com dados segregados
- **ACID completo** — PostgreSQL + Supabase para operações financeiras seguras
- **API REST com padrões definidos** — Express com validação rigorosa
- **Frontend modular** — Next.js com Server Components + React Client
- **Integrações críticas** — ASAAS (pagamentos), WhatsApp, assinaturas digitais

**Tech Stack Decisão:**

| Camada | Tecnologia | Razão |
|--------|------------|-------|
| **Backend** | Node.js/Express | Flexibilidade, middlewares de validação, grande ecossistema |
| **Database** | Supabase (PostgreSQL) | ACID, RLS multi-tenant, realtime, webhooks, backups automáticos |
| **Frontend** | Next.js 14+ | SSR, App Router, Server Components, SEO, dashboards otimizados |
| **Auth** | Supabase Auth | Built-in, integra com JWT, RLS nativa |
| **Pagamentos** | ASAAS | Invoicing automático, webhooks, reconciliação |
| **Mensagens** | WhatsApp API | Notificações pré-formatadas, integração com fluxos |

---

## 2. Arquitetura de Sistema — Visão Geral

```
┌─────────────────────────────────────────────────────────────────┐
│                    CLIENT LAYER (Next.js)                       │
├─────────────────────────────────────────────────────────────────┤
│  Admin Dashboard │ Committee Panel │ Student Panel │ Vendor Panel│
└──────────────────────────────┬──────────────────────────────────┘
                               │ HTTP/HTTPS
┌──────────────────────────────▼──────────────────────────────────┐
│              API GATEWAY & AUTH (Express.js)                    │
│  ┌────────────────┬────────────┬─────────────┬────────────────┐ │
│  │ Auth Middleware│ Rate Limit │  Validation │ Error Handling │ │
│  └────────────────┴────────────┴─────────────┴────────────────┘ │
└──────────────────────────────┬──────────────────────────────────┘
                               │ Internal APIs
┌──────────────────────────────▼──────────────────────────────────┐
│              SERVICE LAYER (Business Logic)                     │
│  ┌──────────┬──────────┬──────────┬──────────┬──────────────┐   │
│  │ Proposal │ Contract │ Payment  │ Financial│ Notification │   │
│  │ Service  │ Service  │ Service  │ Service  │ Service      │   │
│  └──────────┴──────────┴──────────┴──────────┴──────────────┘   │
└──────────────────────────────┬──────────────────────────────────┘
                               │
┌──────────────────────────────▼──────────────────────────────────┐
│           DATA ACCESS LAYER (PostgreSQL/Supabase)               │
│  ┌──────────┬─────────┬──────────┬────────┬──────────────────┐  │
│  │  Users   │ Contracts│Payments  │Vendors │ Financial Records│ │
│  │  Events  │ Proposals│ Invoices │ Files  │ Audit Logs       │ │
│  └──────────┴─────────┴──────────┴────────┴──────────────────┘  │
│  ✓ Row Level Security (RLS)  ✓ Triggers  ✓ Views               │
│  ✓ Webhooks → External Services                                │
└──────────────────────────────┬──────────────────────────────────┘
                               │
         ┌─────────────────────┼─────────────────────┐
         │                     │                     │
    ┌────▼─────┐          ┌────▼─────┐         ┌────▼─────┐
    │  ASAAS   │          │ WhatsApp  │         │  DocuSign│
    │ (Webhooks)          │   (API)   │         │ (API)    │
    └──────────┘          └──────────┘         └──────────┘
```

**Isolamento de Dados (Multi-tenancy):**
- Cada **evento** é um tenant único
- RLS automático em todas as tabelas
- Segregação em queries (WHERE tenant_id = $1)
- Supabase gerencia isolamento de auth per usuário

---

## 3. Database Schema (Visão Geral)

### 3.1 Tabelas Principais

**NOTA:** Esquema completo será delegado para @data-engineer. Aqui está a visão arquitetural.

```
┌─────────────────────────────────────────────────────────────┐
│ Núcleo: Events (Tenant Root)                                │
├─────────────────────────────────────────────────────────────┤
│ id (PK)                                                     │
│ admin_id (FK → users)                                       │
│ name, date, venue, guest_count, status                      │
│ created_at, updated_at                                      │
│ ✓ RLS: Apenas admin + comitê podem acessar                  │
└─────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────┐
│ Usuários & Acesso                                           │
├─────────────────────────────────────────────────────────────┤
│ users (Supabase Auth table)                                 │
│ user_roles (admin, committee, student, vendor)              │
│ event_members (user + event + role)                         │
│ ✓ RLS: Usuários só veem eventos onde são membros            │
└─────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────┐
│ Propostas & Contratos                                       │
├─────────────────────────────────────────────────────────────┤
│ proposals (template, evento, versão)                        │
│ proposal_sections (editable fields)                         │
│ contracts (student/committee contracts)                     │
│ contract_signatures (status, timestamp, file)               │
│ ✓ Immutable: Após assinado, somente leitura                 │
└─────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────┐
│ Pagamentos & Financeiro                                     │
├─────────────────────────────────────────────────────────────┤
│ payment_schedules (monthly installments per student)        │
│ invoices (ASAAS integration records)                        │
│ payments (received, verified status)                        │
│ payment_receipts (student uploads)                          │
│ vendor_payments (outbound to vendors)                       │
│ financial_transactions (audit trail)                        │
│ ✓ ACID: Transações garantem consistência                    │
│ ✓ Webhooks: ASAAS atualiza status em real-time              │
└─────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────┐
│ Fornecedores & Quotações                                    │
├─────────────────────────────────────────────────────────────┤
│ vendors (supplier database)                                 │
│ quotation_requests (evento + categorias)                    │
│ quotations (arquivo + status)                               │
│ vendor_contracts (assinados)                                │
│ ✓ Status: pending, submitted, approved, rejected           │
└─────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────┐
│ Arquivos & Auditoria                                        │
├─────────────────────────────────────────────────────────────┤
│ file_uploads (PDFs, receipts, contracts)                    │
│ audit_log (quem fez o quê, quando)                          │
│ notifications (auditoria de envios)                         │
└─────────────────────────────────────────────────────────────┘
```

**Propriedades Transversais:**
- ✅ Todos os `event_id` como chave de partição RLS
- ✅ `created_at`, `updated_at` timestamps
- ✅ Soft deletes onde aplicável
- ✅ Índices em foreign keys críticas
- ✅ Triggers para auditoria automática

---

## 4. API Design

### 4.1 Estrutura & Padrões

**Caminho Base:** `/api/v1`
**Auth:** Bearer token (Supabase JWT)
**Formato:** JSON
**Versionamento:** URL path (`/api/v1/`, `/api/v2/`)

### 4.2 Endpoints Principais

#### **Eventos (Admin)**
```
POST   /api/v1/events                    # Criar evento
GET    /api/v1/events/{id}               # Detalhes
PATCH  /api/v1/events/{id}               # Atualizar
GET    /api/v1/events/{id}/summary       # Dashboard rápido
```

#### **Propostas & Quotações**
```
POST   /api/v1/events/{id}/proposals     # Criar proposta
GET    /api/v1/events/{id}/proposals     # Listar
POST   /api/v1/events/{id}/quotations/request   # Solicitar quotações
GET    /api/v1/events/{id}/quotations    # Listar recebidas
POST   /api/v1/quotations/{id}/submit    # Fornecedor submete
```

#### **Contratos & Assinaturas**
```
POST   /api/v1/events/{id}/contracts     # Gerar contratos
GET    /api/v1/contracts/{id}            # Detalhes (download)
POST   /api/v1/contracts/{id}/sign       # Assinar digitalmente
GET    /api/v1/contracts/{id}/status     # Status de assinatura
```

#### **Pagamentos**
```
POST   /api/v1/events/{id}/payment-schedule      # Gerar cronograma
GET    /api/v1/events/{id}/payments              # Listar pagamentos
GET    /api/v1/students/{id}/dashboard           # Dashboard aluno
POST   /api/v1/payments/{id}/receipt             # Upload receipt
PATCH  /api/v1/payments/{id}/verify              # Admin verifica
POST   /api/v1/events/{id}/reconcile             # ASAAS sync
```

#### **Contabilidade**
```
GET    /api/v1/events/{id}/financial-report      # Relatório completo
GET    /api/v1/events/{id}/vendor-payments       # Pagamentos a fornecedores
POST   /api/v1/events/{id}/admin-fee             # Calcular/cobrar taxa
```

#### **Notificações**
```
POST   /api/v1/notifications/send-whatsapp       # Enviar via WhatsApp
POST   /api/v1/notifications/send-email          # Enviar via Email
GET    /api/v1/events/{id}/audit-log             # Auditoria
```

### 4.3 Padrões de Resposta

**Sucesso (200, 201):**
```json
{
  "success": true,
  "data": { ... },
  "meta": {
    "timestamp": "2026-03-03T10:30:00Z",
    "version": "1.0"
  }
}
```

**Erro:**
```json
{
  "success": false,
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Field validation failed",
    "details": {
      "field_name": ["erro 1", "erro 2"]
    }
  },
  "meta": { "timestamp": "..." }
}
```

**Códigos de Erro:**
- `400` - Validação falhou
- `401` - Não autenticado
- `403` - Sem permissão (RLS bloqueou)
- `404` - Recurso não existe
- `409` - Conflito (status inválido)
- `422` - Lógica de negócio violated
- `500` - Erro interno

### 4.4 Validação & Segurança

**Middleware Stack (Express):**
```javascript
app.use(express.json({ limit: '10mb' }));
app.use(validateAuth);           // Supabase JWT
app.use(validateTenant);         // Extrai event_id da rota
app.use(validateRateLimit);      // Max 100 req/min por user
app.use(sanitizeInput);          // XSS protection
app.use(validatePayload);        // Zod/Joi schemas
```

**Cada endpoint tem:**
- ✅ Schema de validação (input)
- ✅ Autorização por role (admin, committee, student, vendor)
- ✅ RLS automática via Supabase
- ✅ Logging de auditoria
- ✅ Tratamento de erro estruturado

---

## 5. Frontend Architecture (Next.js)

### 5.1 Estrutura do Projeto

```
src/
├── app/
│   ├── layout.tsx              # Root layout + auth provider
│   ├── (auth)/                 # Login, signup (unprotected)
│   ├── (dashboard)/            # Protected routes com layout
│   │   ├── admin/              # Admin panel
│   │   ├── committee/          # Committee panel
│   │   ├── student/            # Student dashboard
│   │   └── vendor/             # Vendor panel
│   ├── api/                    # Route handlers (if needed for BFF)
│   └── error.tsx, not-found.tsx
│
├── components/
│   ├── auth/                   # Login, logout, session
│   ├── layouts/                # Page layouts
│   ├── shared/                 # Botões, inputs, alerts
│   ├── admin/                  # Admin-specific components
│   ├── committee/              # Committee-specific
│   ├── student/                # Student-specific
│   ├── vendor/                 # Vendor-specific
│   └── dashboard/              # Dashboard widgets, charts
│
├── hooks/
│   ├── useAuth.ts              # Auth context
│   ├── useEvent.ts             # Event data fetching
│   ├── usePayments.ts          # Payment status
│   └── useNotifications.ts     # Real-time (Supabase realtime)
│
├── lib/
│   ├── api/                    # API client (fetch wrapper)
│   ├── supabase.ts             # Supabase client setup
│   ├── constants.ts            # Rotas, status enums
│   └── utils.ts                # Helper functions
│
├── types/
│   ├── index.ts                # Shared types
│   ├── api.ts                  # API response types
│   └── domain.ts               # Event, User, Payment, etc
│
├── styles/
│   ├── globals.css
│   └── variables.css           # Design tokens
│
└── public/                     # Assets, SVGs
```

### 5.2 Padrões de Rendering

**Server Components (Default):**
- Fetch dados no servidor (sem expor APIs internas)
- Renderizar HTML estático
- Melhor performance (menos JS no cliente)

**Uso em Formatura SaaS:**
```typescript
// app/(dashboard)/admin/events/[id]/page.tsx
export default async function EventDetails({ params }) {
  const event = await getEventDetails(params.id);
  const summary = await getFinancialSummary(params.id);

  return (
    <div>
      <EventHeader event={event} />
      <FinancialDashboard data={summary} />
      <StudentPaymentTable eventId={params.id} />
    </div>
  );
}
```

**Client Components (Selected):**
- Formulários interativos
- Real-time updates (Supabase Realtime)
- Gráficos e dashboards dinâmicos

```typescript
'use client';
import { useState, useEffect } from 'react';

export function PaymentStatus({ studentId, eventId }) {
  const [payments, setPayments] = useState([]);

  useEffect(() => {
    // Subscribe to real-time updates
    const subscription = supabase
      .from('payments')
      .on('*', payload => setPayments(prev => [...prev, payload.new]))
      .subscribe();
  }, []);

  return <PaymentChart data={payments} />;
}
```

### 5.3 State Management

**Não usar Redux/Zustand** para este projeto. Simples demais.

**Usar:**
1. **Server state** — Supabase (principal)
2. **Local state** — `useState` para UI local
3. **Query state** — SWR para data fetching + cache

```typescript
// lib/hooks/useEvent.ts
import useSWR from 'swr';

export function useEvent(eventId) {
  const { data, error, isLoading } = useSWR(
    eventId ? `/api/v1/events/${eventId}` : null,
    fetcher,
    { revalidateOnFocus: false, dedupingInterval: 60000 }
  );

  return { event: data, isLoading, error };
}
```

### 5.4 Authentication Flow

**Supabase Auth (Built-in):**

```
1. User logs in (email + password)
2. Supabase retorna JWT + session
3. JWT armazenado em httpOnly cookie
4. Supabase middleware injeta no Auth header
5. RLS automática bloqueia dados não autorizados
6. Frontend recebe apenas dados permitidos
```

**Layout de proteção:**
```typescript
// app/(dashboard)/layout.tsx
export default async function DashboardLayout({ children }) {
  const session = await getSession();

  if (!session) redirect('/auth/login');
  const userRole = await getUserRole(session.user.id);

  return (
    <div>
      <Sidebar role={userRole} />
      {children}
    </div>
  );
}
```

---

## 6. Integration Architecture

### 6.1 ASAAS (Payment Processing)

**Fluxo:**
```
1. Admin cria payment_schedule (cron job → invoices)
2. ASAAS recebe webhook de novo invoice
3. Student paga via link ASAAS
4. Webhook: payment.confirmed → atualiza banco
5. Dashboard real-time reflete pagamento
6. Admin reconcilia com bank statement
```

**Implementação:**
```javascript
// Backend webhook handler
app.post('/webhooks/asaas', (req, res) => {
  const event = req.body.event;

  if (event === 'payment.confirmed') {
    updatePaymentStatus(req.body.payment.id, 'paid');
    notifyStudent(req.body.payment.studentId);
  }

  res.json({ received: true });
});
```

**Segurança:**
- Validar webhook signature (ASAAS secret)
- Idempotência (não processar 2x)
- Audit log de cada webhook

### 6.2 WhatsApp (Notifications)

**Endpoints usados:**
```
POST /messages              # Enviar mensagem
GET  /message-templates     # Templates pré-aprovados
```

**Templates de Formatura SaaS:**
```
1. "Olá {student_name}! Clique aqui para assinar contrato: {link}"
2. "Pagamento de {amount} vence em {date}. Pague aqui: {link}"
3. "Seu pagamento foi verificado! Status: ✅"
4. "Admin: Nova quotação de {vendor}. Revisar: {link}"
```

**Implementação:**
```javascript
// Notification Service
class NotificationService {
  async sendWhatsAppToStudent(studentId, templateKey, vars) {
    const student = await getStudent(studentId);
    const template = TEMPLATES[templateKey];
    const message = interpolate(template, vars);

    await whatsappClient.sendMessage({
      to: student.whatsapp,
      text: message,
      trackingId: `${studentId}-${Date.now()}`,
    });

    await auditLog('notification_sent', studentId, message);
  }
}
```

**Rate limiting:**
- Max 5 mensagens por aluno por dia
- Max 1 por minuto para o mesmo template
- Retry com backoff exponencial

### 6.3 Digital Signatures (DocuSign / similares)

**Fluxo alternativo (Fase 2):**
- Integração nativa com DocuSign API
- Auto-envio de contratos para assinatura
- Webhooks de conclusão
- Armazenamento de PDFs assinados

**MVP (Fase 1):**
- Upload manual de PDF assinado
- Admin visualmente verifica
- Marca como "verified"

### 6.4 Email (Transacional)

**Usar Supabase Database + Trigger:**
```sql
-- Trigger: novo contrato → email automático
CREATE TRIGGER send_contract_email AFTER INSERT ON contracts
FOR EACH ROW EXECUTE FUNCTION send_email(
  email := NEW.student_email,
  subject := 'Seu Contrato de Formatura',
  body := ...
);
```

Ou via SendGrid integration (Supabase Extensions).

---

## 7. Security Architecture

### 7.1 Autenticação & Autorização

**Autenticação:**
- ✅ Supabase Auth (email + senha)
- ✅ JWT tokens com TTL 1 hora
- ✅ Refresh tokens (httpOnly cookies)
- ✅ MFA optional (Fase 2)

**Autorização (Role-Based):**
```
┌──────────────┬─────────────────────────────────────┐
│ Role         │ Permissões                          │
├──────────────┼─────────────────────────────────────┤
│ admin        │ Gerenciar tudo (eventos, contracts) │
│ committee    │ Ver/aprovar proposta, dados alunos  │
│ student      │ Ver próprio contrato + pagamentos   │
│ vendor       │ Submeter quotação, ver pagto        │
└──────────────┴─────────────────────────────────────┘
```

**RLS (Row Level Security):**
```sql
-- Exemplo: alunos só veem seus próprios pagamentos
CREATE POLICY "students_see_own_payments" ON payments
FOR SELECT USING (
  auth.uid() = student_id OR
  auth.jwt()->>'role' = 'admin'
);

-- Comitês só veem seu evento
CREATE POLICY "committees_see_own_event" ON events
FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM event_members
    WHERE event_id = events.id
    AND user_id = auth.uid()
  )
);
```

### 7.2 Data Protection

**Em Trânsito:**
- ✅ HTTPS obrigatório
- ✅ TLS 1.3

**Em Repouso:**
- ✅ Supabase encryption at rest (default)
- ✅ Dados financeiros sensíveis (card tokens via ASAAS, não armazenar local)
- ✅ PII mascarado em logs

**Backup & Compliance:**
- ✅ Supabase backups automáticos (7 dias)
- ✅ LGPD: direito ao esquecimento (soft delete + purge)
- ✅ Audit log imutável

### 7.3 Input Validation & XSS Prevention

**Backend:**
```javascript
import { z } from 'zod';

const createEventSchema = z.object({
  name: z.string().min(3).max(100),
  date: z.coerce.date().future(),
  venue: z.string().max(200),
  guest_count: z.number().int().min(10).max(5000),
});

app.post('/api/v1/events', (req, res) => {
  const result = createEventSchema.safeParse(req.body);
  if (!result.success) return res.status(400).json(result.error);
  // ...
});
```

**Frontend:**
- ✅ Escape HTML em templates (Next.js default)
- ✅ Content Security Policy header
- ✅ CSRF tokens para mutações

### 7.4 Logging & Monitoring

**O que registrar:**
- ✅ Logins (sucesso + falha)
- ✅ Alterações em contratos
- ✅ Pagamentos recebidos/verificados
- ✅ Admin fee calculations
- ✅ Webhook inbound (ASAAS)
- ❌ Senhas, tokens, PII completo

**Retenção:**
- Logs: 90 dias
- Audit trail financeira: 7 anos
- Logs apagados: soft delete + archive em S3

---

## 8. Deployment & Scaling

### 8.1 Arquitetura de Deploy

```
┌─────────────────┐
│   GitHub        │  (repo + CI/CD)
│   Actions       │
└────────┬────────┘
         │ push → main
    ┌────▼────────────────────┐
    │  Vercel Deploy          │
    │  (Next.js frontend)     │
    │  Auto-deploy on push    │
    └────────┬─────────────────┘
             │ ambiente=production
    ┌────────▼──────────────────┐
    │  Railway / Render         │
    │  (Express backend)        │
    │  Auto-deploy on push      │
    └────────┬──────────────────┘
             │ DATABASE_URL
    ┌────────▼──────────────────┐
    │  Supabase Cloud           │
    │  PostgreSQL + Realtime    │
    │  Backups automáticos      │
    └───────────────────────────┘
```

### 8.2 Environment Configuration

**`.env.production`:**
```
NEXT_PUBLIC_API_URL=https://api.formatura.com
SUPABASE_URL=https://xxx.supabase.co
SUPABASE_ANON_KEY=xxx
DATABASE_URL=postgresql://user:pass@host/db

ASAAS_API_KEY=xxx
WHATSAPP_API_TOKEN=xxx
```

**Backend variables:**
```
NODE_ENV=production
PORT=3001
CORS_ORIGIN=https://formatura.com
JWT_SECRET=xxx
LOG_LEVEL=info
```

### 8.3 Scaling Strategy

**Fase 1 (MVP):**
- 100-500 usuários concurrent
- 1 evento por mês
- Vercel serverless (frontend)
- Railway/Render 1x dyno (backend)
- Supabase Free tier OK

**Fase 2 (Growth):**
- 5,000+ usuários concurrent
- 10+ eventos/mês
- Vercel Pro (edge caching)
- Railway 2x dynos + auto-scaling
- Supabase Pro

**Bottlenecks esperados:**
1. **DB connections** — Usar connection pooling (PgBouncer)
2. **API rate limits** — Implementar caching (Redis)
3. **File uploads** — S3 para PDFs/receipts
4. **Webhooks** — Queue system (Bull/RabbitMQ) para retries

---

## 9. Development Workflow

### 9.1 Local Development

```bash
# 1. Clone + setup
git clone https://github.com/your-org/formatura-saas
cd formatura-saas
npm install

# 2. Supabase local
npx supabase start

# 3. Variáveis de ambiente
cp .env.example .env.local

# 4. Rodas tudo
npm run dev         # Next.js (localhost:3000)
npm run api:dev     # Express (localhost:3001)
```

### 9.2 Database Migrations

**Usar Supabase migrations:**
```bash
# Create migration
npx supabase migration new create_events_table

# Edit supabase/migrations/{timestamp}_create_events_table.sql

# Apply locally
npx supabase db push

# Deploy to prod
supabase db push --linked
```

### 9.3 Testing Strategy

**Unit Tests:**
- Validação de schemas (Zod)
- Service logic (payments, financial calc)
- Hooks (useEvent, useAuth)

**Integration Tests:**
- API endpoints (supertest)
- Database operations (jest + test containers)
- Webhook handlers

**E2E Tests:**
- Playwright para fluxos críticos
- Criação de evento → pagamento → relatório
- Login → assinatura → verificação

```bash
npm test              # Unit tests
npm run test:api      # API integration
npm run test:e2e      # E2E (Playwright)
```

### 9.4 Code Review & Quality

**Pre-commit hooks (Husky):**
- ✅ Lint (ESLint)
- ✅ Format (Prettier)
- ✅ Type check (TypeScript)
- ✅ Unit tests pass

**CI/CD (GitHub Actions):**
- Run tests
- Build
- Deploy to staging
- Manual approval → production

---

## 10. Key Decisions & Rationale

| Decisão | Escolha | Alternativas | Razão |
|---------|---------|--------------|-------|
| **Backend Runtime** | Node.js/Express | Django, Go, Java | Ecosystem grande, middlewares prontos, JavaScript everywhere |
| **Database** | Supabase | MongoDB, Firebase | ACID + RLS para multi-tenant + backups inclusos |
| **Frontend Framework** | Next.js 14+ | React SPA, Vue | Server Components, App Router, SSR automático, melhor para dashboards financeiros |
| **Payments** | ASAAS | Stripe, PayPal | Invoicing automático, integração PT-BR, custo-benef |
| **Real-time** | Supabase Realtime | Socket.io, Pusher | Built-in, gerenciado, sem overhead |
| **Auth** | Supabase Auth | Auth0, Firebase | Integrada, RLS automática, sem setup extra |
| **File Storage** | S3 (future) / Supabase Storage (MVP) | Local disk | Escalável, seguro, backup automático |
| **Email** | SendGrid / Supabase Extensions | Nodemailer | Transacional, entrega garantida, webhooks |

---

## 11. Roadmap de Implementação

### Fase 1 (MVP — Semanas 1-8)

**Backend:**
- [ ] Setup Express + Supabase
- [ ] Schema database (events, users, contracts, payments)
- [ ] Auth middleware + JWT
- [ ] CRUD endpoints (events, proposals)
- [ ] ASAAS integration (invoice generation)
- [ ] WhatsApp notification service

**Frontend:**
- [ ] Login/logout
- [ ] Admin dashboard (eventos)
- [ ] Student panel (contracts + pagamentos)
- [ ] Committee panel (visão geral)
- [ ] Real-time payment status

**Qualidade:**
- [ ] Unit tests (80% coverage)
- [ ] API tests
- [ ] Documentação de API (Swagger)
- [ ] Deploy to staging

### Fase 2 (Post-MVP)

- [ ] AI receipt verification
- [ ] Google Calendar integration
- [ ] Digital signature (DocuSign)
- [ ] Vendor panel (full features)
- [ ] Advanced reporting & exports
- [ ] Mobile app (React Native / Flutter)
- [ ] Multi-language support

---

## 12. Critical Success Factors

1. **Isolamento de dados** — RLS bem configurada desde o início
2. **Transações ACID** — Nenhum erro financeiro
3. **Auditoria completa** — Rastreabilidade 100%
4. **Performance de dashboard** — Consultas otimizadas
5. **Rate limiting** — Proteção contra abuse
6. **Backup & disaster recovery** — Plano testado

---

## 13. References & Resources

- **Supabase Docs:** https://supabase.com/docs
- **Next.js App Router:** https://nextjs.org/docs/app
- **Express.js:** https://expressjs.com/
- **ASAAS API:** https://docs.asaas.com/
- **PostgreSQL RLS:** https://www.postgresql.org/docs/current/ddl-rowsecurity.html

---

**Status:** Draft v1.0
**Próximos Passos:**
1. Revisão com @data-engineer (schema detalhado)
2. Aprovação com @pm (alinhamento com PRD)
3. Delegation para @dev (implementação)
4. @qa para testes e validação

---

*Arquitetura criada por Aria (Architect Agent) — 3 de Março, 2026*
