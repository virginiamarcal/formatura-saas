# CodeRabbit Integration Setup — Formatura SaaS

**Date:** 3 de Março, 2026
**Configured by:** Gage (DevOps)
**Status:** ✅ Ready for Use

---

## Overview

CodeRabbit é integrado como **quality gate automático** em toda a pipeline CI/CD do Formatura SaaS.

**Objetivo:** Detectar vulnerabilidades de segurança, problemas de performance, e infrações de padrão de código ANTES de PR ser mergado.

---

## Configuration Files

### 1. `.coderabbit.yaml` (Project Root)
**Propósito:** Configuração centralizada do CodeRabbit para o projeto

**Highlights:**
- ✅ Security scanning (SQL injection, XSS, hardcoded secrets)
- ✅ Performance checks (N+1 queries, bundle size)
- ✅ Code quality (complexity, duplication)
- ✅ RLS policy validation
- ✅ Database migration safety checks

**Severity Levels:**
- 🔴 **CRITICAL** — Blocks PR merge (SQL injection, XSS, RLS bypass, secrets)
- 🟠 **HIGH** — Warns but allows merge (performance issues, missing validation)
- 🟡 **MEDIUM** — Comments on PR (code duplication, complexity)
- 🟢 **LOW** — Suggestions (style, naming)

---

### 2. `.github/workflows/pr-automation.yml`
**Propósito:** GitHub Actions CI/CD pipeline com CodeRabbit integrado

**Jobs:**
1. **coderabbit-review** — Runs CodeRabbit analysis
2. **lint** — ESLint checks
3. **typecheck** — TypeScript validation
4. **test** — Unit tests + coverage
5. **build** — Build verification
6. **story-validation** — Story file format checks
7. **quality-summary** — Gate decision (PASS/FAIL)
8. **deploy-staging** — Deploy to staging (on main)

**Execution Flow:**
```
PR created/updated
       ↓
All jobs run in parallel
       ↓
CodeRabbit blocks if CRITICAL found
       ↓
If all pass: quality-summary = PASS
       ↓
PR can be merged (if approved by human)
       ↓
On merge to main: auto-deploy to staging
```

**Timeout:** 30 minutes total

---

## How CodeRabbit Works

### Pre-PR Review (Automated)
```bash
# When PR is created
GitHub Actions triggers:
  1. coderabbit-review job
  2. Analyzes all changed files
  3. Runs security/performance/quality checks
  4. Posts comments on PR with findings
  5. Blocks merge if CRITICAL issues found
```

### Security Checks
CodeRabbit scans for:
- ✅ SQL Injection vulnerabilities
- ✅ XSS (Cross-Site Scripting)
- ✅ CSRF protection
- ✅ Authentication/Authorization bypass
- ✅ Hardcoded secrets (passwords, API keys)
- ✅ Insecure cryptography
- ✅ Path traversal attacks
- ✅ Remote code execution risks

### Performance Checks
- ✅ N+1 query patterns
- ✅ Inefficient algorithms
- ✅ Bundle size limits (500KB warning)
- ✅ React render optimization
- ✅ Database query optimization

### Code Quality Checks
- ✅ Cyclomatic complexity (limit: 10)
- ✅ Code duplication detection
- ✅ Dead code identification
- ✅ Best practices enforcement

---

## Quality Gate Enforcement

### Branch Protection Rules (GitHub)
**Configure in Settings → Branches → main:**

```
✅ Require CodeRabbit status check to pass
✅ Require lint status check to pass
✅ Require typecheck status check to pass
✅ Require test status check to pass
✅ Require build status check to pass
✅ Require pull request reviews before merging (1 approval)
✅ Require branches to be up to date before merging
✅ Include administrators in restrictions (!)
```

### Auto-Deploy on Main
When PR is merged to main:
1. All jobs run again
2. If all PASS → Auto-deploy to staging
3. If any FAIL → Deployment blocked, PR reverted (admin manual fix)

---

## File-Specific Scanning

### Database Migrations (.sql files)
CodeRabbit validates:
- ✅ Zero-downtime migration (no locks)
- ✅ RLS policy compatibility
- ✅ Rollback script present
- ✅ Index strategy
- ✅ ACID compliance

**Severity:** CRITICAL (blocks merge)

### API Endpoints (routes/*.ts)
CodeRabbit validates:
- ✅ Authentication required
- ✅ Authorization checks
- ✅ Input validation (Zod/Joi)
- ✅ Error handling
- ✅ Rate limiting
- ✅ Audit logging

**Severity:** CRITICAL (blocks merge)

### RLS Policies (db/policies.sql)
CodeRabbit validates:
- ✅ Correct tenant isolation (no cross-event access)
- ✅ No privilege escalation
- ✅ Test coverage (positive + negative)
- ✅ Performance implications

**Severity:** CRITICAL (blocks merge)

---

## Usage Examples

### Example 1: PR with SQL Injection Risk
```
Developer creates PR with:
  SELECT * FROM users WHERE id = '{user_id}'

GitHub Actions:
  1. CodeRabbit detects SQL injection risk
  2. Posts comment: "🔴 CRITICAL: SQL Injection vulnerability"
  3. Blocks PR merge
  4. Developer fixes: SELECT * FROM users WHERE id = $1
  5. Recommits
  6. CodeRabbit re-scans: PASS ✅
  7. PR can be merged
```

### Example 2: PR with N+1 Query Issue
```
Developer creates PR with:
  for (const event of events) {
    const payments = await db.query('SELECT * FROM payments WHERE event_id = ?', event.id)
  }

GitHub Actions:
  1. CodeRabbit detects N+1 pattern
  2. Posts comment: "🟠 HIGH: N+1 query detected"
  3. Suggests fix with JOIN
  4. PR can still merge (with warning)
  5. Developer can choose to fix or document debt
```

### Example 3: PR with Missing Test Coverage
```
Developer creates PR adding new feature without tests

GitHub Actions:
  1. CodeRabbit checks: Coverage < 80%
  2. Posts comment: "🟡 MEDIUM: Test coverage below 80%"
  3. Suggests test cases
  4. PR can merge with notice
  5. Developer should add tests in next sprint
```

---

## Severity Actions

### 🔴 CRITICAL
- **Action:** BLOCKS PR MERGE
- **When:** Security vulnerabilities, data loss risks
- **Examples:**
  - SQL injection
  - XSS vulnerability
  - Hardcoded secrets
  - RLS policy bypass
  - Missing authentication
- **Resolution:** Developer MUST fix before merge

### 🟠 HIGH
- **Action:** WARNS, allows merge with caution
- **When:** Performance issues, missing validation
- **Examples:**
  - N+1 queries
  - Missing input validation
  - Inefficient algorithms
- **Resolution:** Developer should fix before merge

### 🟡 MEDIUM
- **Action:** COMMENTS on PR
- **When:** Code quality improvements
- **Examples:**
  - Code duplication
  - High complexity
  - Missing tests
- **Resolution:** Can create follow-up issue

### 🟢 LOW
- **Action:** SUGGESTIONS only
- **When:** Minor improvements
- **Examples:**
  - Code style
  - Naming conventions
- **Resolution:** Optional, note for next sprint

---

## Setup Instructions

### For Developers
1. **No action needed** — CodeRabbit runs automatically on every PR
2. When PR is created, check for CodeRabbit comments
3. Fix CRITICAL issues before requesting review
4. Merge once all checks PASS

### For DevOps (First Time Setup)
1. ✅ `.coderabbit.yaml` created (in repo)
2. ✅ `.github/workflows/pr-automation.yml` created
3. **TODO:** Configure GitHub branch protection rules:
   - Go to: Settings → Branches → main
   - Enable: "Require CodeRabbit status check"
   - Enable: "Require all status checks to pass"
   - Enable: "Require review before merge"

### For CI/CD Pipeline
CodeRabbit is triggered automatically by:
- PR creation/update
- Push to feature branches
- Merge to main

No manual trigger needed.

---

## Monitoring & Reporting

### CodeRabbit Reports
Location: `docs/qa/coderabbit-reports/`

**Generated for each PR:**
- `pr-{number}-coderabbit-report.json` — Full analysis
- `pr-{number}-coderabbit-summary.md` — Summary comment

### Dashboard (GitHub)
- **Settings → Security → Code scanning** — View all findings
- **PR page** — CodeRabbit comment on each PR
- **Checks tab** — Detailed job results

### Slack Notifications (Optional)
Can be configured to post CodeRabbit findings to Slack:
```bash
# Not yet configured, but available if needed
# Configure in: GitHub → Slack App → Notifications
```

---

## Troubleshooting

### CodeRabbit job timing out
**Error:** `CodeRabbit review timeout after 30 minutes`

**Solution:**
- Check code changes are reasonable size
- Large refactors may need longer timeout
- Contact DevOps to increase timeout

### False Positive (CodeRabbit incorrect finding)
**Error:** CodeRabbit blocks legitimate code

**Solution:**
1. Comment on PR: `@coderabbit I think this is a false positive because...`
2. CodeRabbit will re-analyze with context
3. Or manually override (admin only) with justification in PR

### CodeRabbit not triggering
**Error:** CodeRabbit doesn't appear on PR

**Solution:**
- Ensure `.coderabbit.yaml` exists in repo root
- Ensure `.github/workflows/pr-automation.yml` exists
- Check GitHub Actions is enabled (Settings → Actions)
- Force re-run: Click "Re-run jobs" on PR checks

---

## Epic Integration

### EPIC-6.4: CI/CD Pipeline Setup
**Story Status:** ✅ IMPLEMENTED

This setup fulfills Story 6.4 requirements:
- ✅ CodeRabbit integrated
- ✅ GitHub Actions configured
- ✅ Lint, typecheck, test, build jobs
- ✅ Quality gate enforcement
- ✅ Auto-deploy to staging
- ✅ Branch protection rules (manual setup needed)

**Next Steps:**
1. @devops completes GitHub branch protection setup
2. @dev uses pipeline in daily workflow
3. @qa monitors for false positives
4. Weekly review of CodeRabbit findings

---

## Rollout Timeline

| Week | Action | Owner |
|------|--------|-------|
| **Week 1** | CodeRabbit config created | ✅ Gage (@devops) |
| **Week 1** | GitHub Actions workflow created | ✅ Gage (@devops) |
| **Week 2** | Branch protection rules enabled | TODO: DevOps admin |
| **Week 2-8** | CI/CD enforced during development | @dev |
| **Week 8+** | Monitor and tune rules | @devops |

---

## Questions?

For questions about CodeRabbit configuration:
- **Security rules:** Ask @qa (Quinn)
- **CI/CD setup:** Ask @devops (Gage)
- **Performance tuning:** Ask @architect (Aria)
- **False positives:** Create issue in GitHub

---

**Status:** ✅ Configured and Ready

Gage (DevOps) — 3 de Março, 2026

*Formatura SaaS — CodeRabbit Integration Complete*
