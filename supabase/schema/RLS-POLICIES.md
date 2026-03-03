# Formatura SaaS — Row Level Security (RLS) Policies Documentação

**Data:** 3 de Março, 2026
**Arquiteto:** Dara (Data Engineer)
**Status:** Complete
**Referência:** PostgreSQL RLS + Supabase Auth

---

## Visão Geral RLS

### O que é RLS?

Row Level Security é um mecanismo do PostgreSQL que **filtra automaticamente dados no nível de linha** baseado na identidade do usuário.

```
┌─────────────────────────────────────────┐
│ SELECT * FROM payments WHERE user_id=123│ (from app)
├─────────────────────────────────────────┤
│   RLS Policy Applied (IF ...USING...)   │ (postgresql.conf)
├─────────────────────────────────────────┤
│ ✓ Row 1: user_id = 123 PASS             │
│ ✗ Row 2: user_id = 456 FILTERED OUT     │
│ ✗ Row 3: user_id = 789 FILTERED OUT     │
├─────────────────────────────────────────┤
│ Result: 1 row (só dados do usuário 123)│
└─────────────────────────────────────────┘
```

### Por que RLS?

| Vantagem | Descrição |
|----------|-----------|
| **Segurança em camadas** | Não confiar só na app layer |
| **Auditável** | RLS aplicada em TODAS as queries |
| **Zero-trust** | Admin == dev == mesmo RLS |
| **Compliance** | GDPR/LGPD automático |
| **Performance** | Index-aware, rápido |

---

## Matriz de Acesso (Resumida)

### Tabela: events

| User Role | Can See | Via Policy |
|-----------|---------|-----------|
| Admin (owner) | Seu próprio evento | `admin_see_own_events` |
| Membro ativo | Evento que participa | `members_see_event` |
| Membro removido | ❌ Nada | (RLS bloqueia) |
| Não-membro | ❌ Nada | (RLS bloqueia) |

### Tabela: payments

| User Role | Can See | Via Policy |
|-----------|---------|-----------|
| Student | Seus próprios pagamentos | `student_see_own_payments` |
| Admin do evento | Todos os pagamentos do evento | `admin_override_payments` |
| Outro admin | ❌ Nada | (RLS bloqueia) |
| Vendor | ❌ Nada | (RLS bloqueia) |

### Tabela: contracts

| User Role | Can See | Via Policy |
|-----------|---------|-----------|
| Membro do evento | Contratos do evento | `see_contracts` |
| Signatário | Seu contrato específico | (via payment_allocation) |
| Não-membro | ❌ Nada | (RLS bloqueia) |

### Tabela: notifications

| User Role | Can See | Via Policy |
|-----------|---------|-----------|
| Recipient | Suas próprias notificações | `see_own_notifications` |
| Outro usuário | ❌ Nada | (RLS bloqueia) |
| Admin | ⚠️ Não vê automaticamente | (sem policy = no access) |

---

## Policies Implementadas

### 1. events — admin_see_own_events

```sql
CREATE POLICY "admin_see_own_events" ON events
FOR SELECT
USING (admin_id = auth.uid());
```

**Lógica:**
- User vê event se: user.id == event.admin_id
- Aplicado em: SELECT

**Casos de Teste:**

```
User A é admin de Event 1:
SELECT * FROM events WHERE id='event-1';  ✅ Retorna
SELECT * FROM events WHERE id='event-2';  ❌ Filtered

User B é admin de Event 2:
SELECT * FROM events WHERE id='event-1';  ❌ Filtered
SELECT * FROM events WHERE id='event-2';  ✅ Retorna
```

---

### 2. events — members_see_event

```sql
CREATE POLICY "members_see_event" ON events
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM event_members
    WHERE event_members.event_id = events.id
    AND event_members.user_id = auth.uid()
    AND event_members.removed_at IS NULL
  )
);
```

**Lógica:**
- User vê event se: user é membro ativo (not removed) do evento
- Aplicado em: SELECT
- Soft delete support: removed_at = NULL

**Casos de Teste:**

```
User C é membro ativo de Event 1:
SELECT * FROM events WHERE id='event-1';  ✅ Retorna

User C foi removido de Event 1 (removed_at = '2026-03-03'):
SELECT * FROM events WHERE id='event-1';  ❌ Filtered (removed_at != NULL)

User D não é membro:
SELECT * FROM events WHERE id='event-1';  ❌ Filtered (no row in event_members)
```

---

### 3. event_members — see_event_members

```sql
CREATE POLICY "see_event_members" ON event_members
FOR SELECT
USING (
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
```

**Lógica:**
- Admin do evento vê todos os membros
- Membro ativo do evento vê todos os membros
- Outsider vê nada

**Casos de Teste:**

```
User A (admin de Event 1):
SELECT * FROM event_members WHERE event_id='event-1';  ✅ Retorna todos

User C (membro ativo de Event 1):
SELECT * FROM event_members WHERE event_id='event-1';  ✅ Retorna todos

User D (não-membro):
SELECT * FROM event_members WHERE event_id='event-1';  ❌ Filtered
```

---

### 4. proposals — see_proposals

```sql
CREATE POLICY "see_proposals" ON proposals
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM event_members
    WHERE event_members.event_id = proposals.event_id
    AND event_members.user_id = auth.uid()
  )
);
```

**Lógica:**
- Membro do evento vê propostas do evento
- Aplicado em: SELECT

**Casos de Teste:**

```
User C é membro de Event 1:
SELECT * FROM proposals WHERE event_id='event-1';  ✅ Retorna

User D não é membro:
SELECT * FROM proposals WHERE event_id='event-1';  ❌ Filtered
```

---

### 5. contracts — see_contracts

```sql
CREATE POLICY "see_contracts" ON contracts
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM event_members
    WHERE event_members.event_id = contracts.event_id
    AND event_members.user_id = auth.uid()
  )
);
```

**Lógica:**
- Membro do evento vê contratos do evento

**Casos de Teste:**

```
User C é membro de Event 1:
SELECT * FROM contracts WHERE event_id='event-1';  ✅ Retorna todos

User D não é membro:
SELECT * FROM contracts WHERE event_id='event-1';  ❌ Filtered
```

---

### 6. contract_signatures — see_own_signatures

```sql
CREATE POLICY "see_own_signatures" ON contract_signatures
FOR SELECT
USING (signer_id = auth.uid());
```

**Lógica:**
- Signatário vê sua própria assinatura
- Aplicado em: SELECT
- **Nota:** Admin não vê automaticamente (privacidade de quem assinou)

**Casos de Teste:**

```
User A assinou Contract 1:
SELECT * FROM contract_signatures WHERE contract_id='contract-1';  ✅ Retorna sua signature

User B não assinou:
SELECT * FROM contract_signatures WHERE contract_id='contract-1';  ❌ Filtered
```

---

### 7. payments — student_see_own_payments

```sql
CREATE POLICY "student_see_own_payments" ON payments
FOR SELECT
USING (
  student_id = auth.uid()
  OR auth.uid() IN (
    SELECT admin_id FROM events WHERE events.id = payments.event_id
  )
);
```

**Lógica:**
- Aluno vê seus próprios pagamentos
- Admin do evento vê TODOS os pagamentos do evento
- **Double condition:** OR logic (any can trigger)

**Casos de Teste:**

```
User (aluno) = user-123, Payment de user-123:
SELECT * FROM payments WHERE id='pay-1' AND student_id='user-123';  ✅ Retorna

User (aluno) = user-123, Payment de user-456:
SELECT * FROM payments WHERE id='pay-2' AND student_id='user-456';  ❌ Filtered

User (admin) = admin-999, Event 1:
SELECT * FROM payments WHERE event_id='event-1';  ✅ Retorna TODOS

User (admin) = admin-888, Event 1 (outro admin):
SELECT * FROM payments WHERE event_id='event-1';  ❌ Filtered
```

---

### 8. invoices — student_see_own_invoices

```sql
CREATE POLICY "student_see_own_invoices" ON invoices
FOR SELECT
USING (
  student_id = auth.uid()
  OR auth.uid() IN (
    SELECT admin_id FROM events WHERE events.id = invoices.event_id
  )
);
```

**Lógica:**
- Aluno vê suas próprias faturas
- Admin vê faturas do evento

**Casos de Teste:**

```
User (aluno) = user-123:
SELECT * FROM invoices WHERE student_id='user-123';  ✅ Retorna

User (aluno) = user-123 (faturas de outro aluno):
SELECT * FROM invoices WHERE student_id='user-456';  ❌ Filtered

User (admin) = admin-999:
SELECT * FROM invoices WHERE event_id='event-1';  ✅ Retorna TODOS
```

---

### 9. notifications — see_own_notifications

```sql
CREATE POLICY "see_own_notifications" ON notifications
FOR SELECT
USING (recipient_id = auth.uid());
```

**Lógica:**
- Usuário vê apenas suas próprias notificações
- Simples e direto

**Casos de Teste:**

```
User A com notificações:
SELECT * FROM notifications WHERE recipient_id='user-123';  ✅ Retorna

User B tentando acessar notificações de User A:
SELECT * FROM notifications WHERE recipient_id='user-456';  ❌ Filtered
```

---

## Tabelas SEM Policies (Por Design)

### payment_receipts, vendor_payments, quotations, etc.

**Por quê?**

Essas tabelas são acessadas **somente através de queries da aplicação** que:
1. Verificam RLS no evento pai
2. Filtram explicitamente

**Exemplo:**

```javascript
// App code
async getPaymentReceipts(eventId, paymentId) {
  // 1. Verificar: user é membro do evento?
  const isMember = await event_members.findOne({
    event_id: eventId,
    user_id: auth.uid()
  });
  if (!isMember) throw ForbiddenError();

  // 2. Buscar receipt (já filtrada por event_id cascata)
  return db.query(
    `SELECT * FROM payment_receipts
     WHERE payment_id = $1 AND event_id = $2`,
    [paymentId, eventId]
  );
}
```

---

## Como Testar RLS

### 1. Teste com Supabase CLI

```bash
# Login como User A
supabase auth --jwt "user-a-token"

# Query como User A (deve ver só dados de A)
psql -h api.supabase.co -U authenticated -d formatura_saas \
  -c "SELECT * FROM payments WHERE student_id = auth.uid();"
# Resultado: Apenas payments onde student_id = user-a

# Tentar acessar payment de outro user
psql -c "SELECT * FROM payments WHERE id='payment-of-user-b';"
# Resultado: ❌ Filtered — 0 rows
```

### 2. Teste Unitário (Node.js)

```javascript
// test/rls.test.js
const { createClient } = require('@supabase/supabase-js');

describe('RLS Policies', () => {
  let userAClient, userBClient;

  beforeAll(async () => {
    // Setup: Criar 2 usuários
    userAClient = createClient(URL, KEY);
    userBClient = createClient(URL, KEY);

    // Autenticar como User A e User B
    await userAClient.auth.signUp({email: 'a@test.com'});
    await userBClient.auth.signUp({email: 'b@test.com'});
  });

  test('Student A cannot see payments of Student B', async () => {
    // User A query
    const { data, error } = await userAClient
      .from('payments')
      .select('*')
      .eq('student_id', 'user-b-id');

    expect(error).toBeDefined();
    expect(data).toEqual([]);
  });

  test('Admin can see all payments in event', async () => {
    // Admin query
    const { data } = await adminClient
      .from('payments')
      .select('*')
      .eq('event_id', 'event-1');

    expect(data.length).toBeGreaterThan(1);
  });
});
```

### 3. Teste Manual (SQL)

```sql
-- 1. Conectar como User 123
SET ROLE authenticated;
SET app.current_user_id = 'user-123-uuid';

-- 2. Tentar SELECT
SELECT id, student_id FROM payments LIMIT 1;
-- Esperado: Erro RLS ou 0 rows (se user-123 não pagador)

-- 3. SELECT com JOIN
SELECT p.id, e.name FROM payments p
JOIN events e ON p.event_id = e.id;
-- Esperado: Retorna APENAS payments de user-123

-- 4. Admin override
SET ROLE authenticated;
SET app.current_user_id = 'admin-999-uuid';

SELECT COUNT(*) FROM payments WHERE event_id = 'event-1';
-- Esperado: Retorna TODOS os pagamentos do evento
```

---

## Troubleshooting RLS

### Problema: "Policy not found" ou "No rows returned"

**Causa:** Policy não criada ou ON condition é FALSE

**Solução:**

```sql
-- Listar policies de uma tabela
SELECT policyname, qual, with_check
FROM pg_policies
WHERE tablename = 'payments';

-- Debugar condition (versão simplificada)
SELECT EXISTS (
  SELECT 1 FROM event_members
  WHERE event_id = 'event-123'
  AND user_id = auth.uid()
  AND removed_at IS NULL
);
-- Se retorna FALSE → usuário não é membro
```

### Problema: "Permission denied for schema public"

**Causa:** RLS está bloqueando mas usuário não está autenticado

**Solução:**

```sql
-- Verificar sessão
SELECT auth.uid();  -- Deve retornar UUID

-- Se NULL: não autenticado
-- Confirmar token JWT válido
```

### Problema: Admin vendo dados de outro evento

**Causa:** Policy não verifica event_id

**Solução:** Toda policy deve incluir event_id

```sql
-- ❌ Errado (não filtra evento)
CREATE POLICY "payments" ON payments
FOR SELECT USING (student_id = auth.uid());

-- ✅ Certo (filtra evento + student)
CREATE POLICY "payments" ON payments
FOR SELECT USING (
  (student_id = auth.uid() AND event_id = context.event_id)
  OR admin_id = auth.uid()
);
```

---

## Checklist RLS Pré-Deploy

- [ ] 10+ policies criadas (vide schema DDL)
- [ ] RLS habilitado em 19 tabelas
- [ ] Teste com user A vs user B (não cross-access)
- [ ] Admin vê dados do próprio evento apenas
- [ ] Student vê dados pessoais apenas
- [ ] Soft deletes (removed_at) funcionando
- [ ] Performance OK (EXPLAIN < 1ms com RLS)
- [ ] Audit log não deletável (immutable)
- [ ] Financial transactions not bypassable

---

## Futuras Melhorias

### RLS v2: Granular Roles

```sql
-- Próximo: committee pode aprovar mas não editar orçamento
CREATE POLICY "committee_approve_contracts" ON contracts
FOR UPDATE USING (auth.jwt()->>'role' = 'committee')
WITH CHECK (status IN ('reviewed', 'approved'));
```

### RLS v2: Time-based Access

```sql
-- Próximo: event archived = leitura apenas
CREATE POLICY "archived_readonly" ON events
FOR UPDATE USING (status != 'archived');
```

---

*Documentação de RLS — Formatura SaaS v1.0*

Dara, Data Engineer — 3 de Março, 2026
