# User Stories

Esta pasta contém todas as **user stories** criadas pelo @sm (Scrum Master) a partir dos epics validados pelo @po (Product Owner).

## Estrutura de Nomenclatura

**Padrão:** `{epic-number}.{story-number}.story.md`

**Exemplos:**
- `1.1.story.md` — Story 1.1 (EPIC-1, Story #1)
- `1.7.story.md` — Story 1.7 (EPIC-1, Story #7)
- `2.1.story.md` — Story 2.1 (EPIC-2, Story #1)
- `6.4.story.md` — Story 6.4 (EPIC-6, Story #4)

## Status de Desenvolvimento

| Epic | Stories | Status | Owner |
|------|---------|--------|-------|
| EPIC-1: Proposal & Quotation | 1.1 - 1.7 | 🟡 In Progress | @dev |
| EPIC-2: Contract Lifecycle | 2.1 - 2.X | ⏳ Pending | @dev |
| EPIC-3: Payment Management | 3.1 - 3.X | ⏳ Pending | @dev |
| EPIC-4: Student Dashboard | 4.1 - 4.X | ⏳ Pending | @dev |
| EPIC-5: Financial Reporting | 5.1 - 5.X | ⏳ Pending | @dev |
| EPIC-6: Infrastructure | 6.1 - 6.X | ⏳ Pending | @devops |

## Ciclo de Vida de uma Story

### 1️⃣ Draft (🟡)
- Story criada por @sm
- Aguardando validação por @po
- Status no arquivo: "Draft"

### 2️⃣ Ready (🟢)
- Validado por @po
- Pronto para implementação por @dev
- Status: "Ready"

### 3️⃣ In Progress (🔵)
- @dev está implementando
- Status: "In Progress"
- Branch criado: `feature/X.Y-story-name`

### 4️⃣ Review (🟣)
- Implementação concluída
- Aguardando revisão de @qa
- Status: "Ready for Review"

### 5️⃣ Done (✅)
- @qa aprovou
- CodeRabbit passou
- Merged para main
- Status: "Done"

## Seções Obrigatórias em Cada Story

Cada arquivo `.story.md` DEVE incluir:

```markdown
# Story X.Y: [Title]

[Metadata]
**Story ID:** X.Y
**Epic:** EPIC-X
**Status:** Draft
**Story Points:** N
**Sprint:** W1-2

## 📖 User Story
As a [role], I want to [action], so that [value]

## ✅ Acceptance Criteria
- [ ] AC 1
- [ ] AC 2
- [ ] ...

## 📋 Technical Details
- Database schema changes
- API endpoints
- Frontend components
- RLS policies

## 🎯 Implementation Steps
- Phase 1: Backend
- Phase 2: Frontend
- Phase 3: Testing

## 🔗 Dependencies
- Blockers
- Blocked by
- Enables

## 📊 File List
Files to create/modify during implementation

## 🔒 Security Considerations
RLS, XSS, validation, etc.

## 🎯 Quality Gates (CodeRabbit)
Pre-development and pre-merge checks

## 📝 Notes for Dex (@dev)
Implementation guidance specific to this story

## ✨ Success Criteria Summary
DONE when all of these are true
```

## Como Usar Esta Pasta

### Para @sm (River) — Criar Story
```bash
# 1. Abrir EPIC-X correspondente
# 2. Criar arquivo docs/stories/X.Y.story.md
# 3. Preencher template completo
# 4. Enviar para @po validação

*draft  # Command para criar próxima story
```

### Para @po (Pax) — Validar Story
```bash
# 1. Revisar 10-point checklist
# 2. Marcar como "Ready" ou "Needs Work"
# 3. Adicionar feedback se necessário

*validate-story-draft  # Command para validar
```

### Para @dev (Dex) — Implementar Story
```bash
# 1. Ler story completa
# 2. Criar branch: git checkout -b feature/X.Y-story-name
# 3. Implementar conforme "Implementation Steps"
# 4. Atualizar "File List" com arquivos criados
# 5. Marcar checkboxes conforme completa
# 6. Executar testes

*develop  # Command para implementar story
```

### Para @qa (Quinn) — Testar Story
```bash
# 1. Ler "Success Criteria Summary"
# 2. Executar "Quality Gates"
# 3. Verificar implementação no branch

*qa-gate  # Command para gate story
```

## Commands Relacionados

- `*draft` — @sm cria próxima story
- `*validate-story-draft` — @po valida story
- `*develop` — @dev implementa story
- `*qa-gate` — @qa testa story

## Rastreamento de Progresso

**Total de Stories:** ~45 (conforme PO validation report)

**Pronto para Dev:**
- 1.1: Admin Creates Proposal Template (8 pts) ✅ Draft created

**Próximas Stories (em ordem):**
- 1.2: Admin Sends Proposal to Committee (5 pts)
- 1.4: Admin Requests Quotations from Vendors (8 pts)
- 1.5: Vendor Submits Quotation (8 pts)
- 1.6: Admin Compares & Approves Quotations (8 pts)
- 1.3: Committee Reviews Proposal (5 pts)
- 1.7: Quotation Audit & Search (5 pts)
- [EPIC-2 stories...]
- [EPIC-3 stories...]
- [etc...]

## Links Relacionados

- 📋 [EPIC-1: Proposal & Quotation](../epics/EPIC-1-PROPOSAL-QUOTATION.md)
- 📋 [EPIC-2: Contract Lifecycle](../epics/EPIC-2-CONTRACT-LIFECYCLE.md)
- 📋 [EPIC-3: Payment Management](../epics/EPIC-3-PAYMENT-MANAGEMENT.md)
- 📋 [EPIC-4: Student Dashboard](../epics/EPIC-4-STUDENT-DASHBOARD.md)
- 📋 [EPIC-5: Financial Reporting](../epics/EPIC-5-FINANCIAL-REPORTING.md)
- 📋 [EPIC-6: Infrastructure](../epics/EPIC-6-INFRASTRUCTURE-DEPLOYMENT.md)
- ✅ [PO Validation Report](../PO-VALIDATION-REPORT.md)

---

*Formatura SaaS — User Stories Archive*
