# Branch Protection Rules Setup — Formatura SaaS

**Date:** 3 de Março, 2026
**Configured by:** Gage (DevOps)
**Status:** Ready for Manual Implementation

---

## Overview

Branch Protection Rules garantem que **NENHUM código quebrado ou inseguro é mergado para main**.

Sem essas regras:
- ❌ Dev pode push direto pra main (sem testes)
- ❌ Código com vulnerabilidades passa
- ❌ Sem revisão de código
- ❌ Sem histórico de mudanças

Com essas regras:
- ✅ Todos os checks devem PASSAR
- ✅ CodeRabbit valida segurança
- ✅ Humano revisa e aprova
- ✅ Audit trail completo

---

## Setup via GitHub CLI

### Opção 1: Command Line (Recomendado)

```bash
# 1. Autenticar no GitHub
gh auth login

# 2. Navegar para o repo
cd /path/to/formatura-saas

# 3. Create branch protection rule for main
gh api repos/{owner}/{repo}/branches/main/protection \
  -X PUT \
  -f required_status_checks='{
    "strict": true,
    "contexts": [
      "coderabbit-review",
      "lint",
      "typecheck",
      "test",
      "build",
      "quality-summary"
    ]
  }' \
  -f required_pull_request_reviews='{
    "dismissal_restrictions": {},
    "dismiss_stale_reviews": true,
    "require_code_owner_reviews": false,
    "required_approving_review_count": 1
  }' \
  -f enforce_admins=true \
  -f allow_force_pushes=false \
  -f allow_deletions=false \
  -f required_linear_history=false \
  -f allow_auto_merge=true \
  -f dismiss_stale_reviews=true \
  -f require_branches_to_be_up_to_date=true

# 4. Verify configuration
gh api repos/{owner}/{repo}/branches/main/protection
```

### Opção 2: Web UI (Manual)

1. Go to: **GitHub.com → formatura-saas → Settings → Branches**
2. Click: **Add rule**
3. Enter: **Branch name pattern:** `main`
4. Enable checkboxes:
   - ✅ Require a pull request before merging
   - ✅ Require approvals (1)
   - ✅ Dismiss stale pull request approvals when new commits are pushed
   - ✅ Require status checks to pass before merging
   - ✅ Require branches to be up to date before merging
   - ✅ Require code owner reviews (optional)
   - ✅ Include administrators
   - ✅ Allow auto-merge
5. Click: **Create**

---

## Configuration Details

### Required Status Checks

These must ALL pass before merge:

```
☑️ coderabbit-review    (Security + Code Quality)
☑️ lint                 (ESLint)
☑️ typecheck            (TypeScript)
☑️ test                 (Jest + Coverage 80%)
☑️ build                (npm run build)
☑️ quality-summary      (Gate decision)
```

If ANY fail → PR cannot be merged (unless admin override)

### Pull Request Requirements

```
☑️ Require pull request reviews before merging
   └─ Required approving reviews: 1
   └─ Dismiss stale reviews on new commits: YES
   └─ Require review from code owners: NO
```

Human code review ensures:
- Code quality beyond automated checks
- Business logic correctness
- Performance implications
- Architecture alignment

### Additional Protections

```
☑️ Require branches to be up to date before merging
   └─ If main changes, PR must rebase before merge
   └─ Prevents merging outdated code

☑️ Include administrators
   └─ Rules apply to everyone, including admins
   └─ No shortcuts for privileged users

☑️ Allow auto-merge
   └─ PR can be auto-merged once all checks pass
   └─ Reduces manual work
   └─ Keeps history clean

☑️ Restrict who can push
   └─ Only @devops (Gage) can push
   └─ via git pre-push hook enforcement
```

---

## Implementation Steps

### Step 1: Create Branch Protection Rule
**Via CLI:**
```bash
gh api repos/your-org/formatura-saas/branches/main/protection \
  -X PUT \
  -f required_status_checks='{
    "strict": true,
    "contexts": [
      "coderabbit-review",
      "lint",
      "typecheck",
      "test",
      "build",
      "quality-summary"
    ]
  }' \
  -f required_pull_request_reviews='{
    "dismissal_restrictions": {},
    "dismiss_stale_reviews": true,
    "require_code_owner_reviews": false,
    "required_approving_review_count": 1
  }' \
  -f enforce_admins=true \
  -f allow_force_pushes=false \
  -f allow_deletions=false \
  -f allow_auto_merge=true \
  -f require_branches_to_be_up_to_date=true
```

### Step 2: Verify Setup
```bash
# Check if rule is active
gh api repos/your-org/formatura-saas/branches/main/protection

# Should return JSON with all settings
```

### Step 3: Test the Rule
1. Create a test PR with intentional bug
2. Push code that fails linting
3. Verify CodeRabbit blocks it
4. Try to merge → Should fail with "Checks must pass"
5. Fix issue, recommit
6. Verify merge works once all pass

---

## Git Pre-Push Hook (Enforcement)

Additionally, install git hook to prevent direct push to main:

**File:** `.git/hooks/pre-push`

```bash
#!/bin/bash

# Prevent direct push to main/master
protected_branch='main'
current_branch=$(git rev-parse --abbrev-ref HEAD)

if [[ $current_branch == $protected_branch ]]; then
    echo "🚫 Cannot push directly to $protected_branch"
    echo "Please create a Pull Request instead"
    exit 1
fi

exit 0
```

**Setup:**
```bash
# Make hook executable
chmod +x .git/hooks/pre-push

# Test it
git push origin main
# Output: "🚫 Cannot push directly to main"
```

---

## Workflow After Setup

### Developer Workflow

1. **Create feature branch:**
   ```bash
   git checkout -b feature/my-feature
   ```

2. **Code & commit:**
   ```bash
   git add .
   git commit -m "feat: add my feature"
   ```

3. **Push to GitHub:**
   ```bash
   git push origin feature/my-feature
   ```

4. **Create PR:**
   ```bash
   gh pr create --title "Add my feature" --body "Description"
   ```

5. **Wait for checks:**
   - GitHub Actions runs all 6 jobs
   - CodeRabbit reviews for security
   - Takes ~5-10 minutes

6. **Address feedback:**
   - If CodeRabbit finds issues → Fix them
   - If tests fail → Fix them
   - Recommit and push

7. **Request review:**
   - Ping reviewer once all checks pass
   - Reviewer reads code and approves

8. **Merge PR:**
   - Once approved + all checks pass
   - Auto-merge triggers deploy to staging

---

## Automated PR Auto-Merge

Once all checks pass AND human approval received:

```bash
# Auto-merge PR after conditions met
gh pr merge {pr-number} --auto --squash
```

Benefits:
- ✅ No manual merge button needed
- ✅ Automatic deploy to staging
- ✅ Clean history (squash commits)
- ✅ Faster iteration cycle

---

## Rollback Protection

If merged code causes staging failure:

1. **Automated rollback:**
   - Staging health check detects error
   - Auto-reverts main to previous commit
   - Alerts team via Slack

2. **Manual rollback (if needed):**
   ```bash
   # Find previous good commit
   git log --oneline main | head -5

   # Revert to good state
   git revert {bad-commit-hash}
   git push origin main
   ```

---

## Troubleshooting

### "Required status checks are not available"
**Problem:** CodeRabbit job name doesn't match

**Solution:**
- Check exact job name in `.github/workflows/pr-automation.yml`
- Update branch protection rule with correct name
- Example: `coderabbit-review` (not `coderabbit` or `code-rabbit`)

### "Cannot merge - checks pending"
**Problem:** Impatient dev trying to merge before checks finish

**Solution:**
- Wait ~10 minutes for all checks to complete
- Check "Checks" tab on PR to see progress
- If stuck, comment `@github-devops rerun-checks`

### "Admin override push"
**Problem:** Someone force-pushes to main despite rule

**Solution:**
- Branch protection rule has `enforce_admins=true`
- Blocks even admins from force-pushing
- If emergency override needed: Remove rule, push, re-enable rule
- Document in incident log

---

## Monitoring Compliance

### Weekly Compliance Report

```bash
# Check merge activity on main
gh api repos/your-org/formatura-saas/commits \
  --paginate \
  -q '.[].commit.message' | head -20

# Verify all have PR references
```

---

## Status: Ready to Deploy

**What's configured:**
- ✅ GitHub Actions (6 jobs)
- ✅ CodeRabbit integration
- ✅ Branch protection rules (documentation)
- ✅ Git pre-push hook (documentation)
- ✅ Auto-merge setup (documentation)

**Next steps:**
1. Run setup commands above
2. Test with dummy PR
3. Monitor first week for issues
4. Tune rules based on team feedback

---

**Status:** ✅ Ready for Implementation

Gage (DevOps) — 3 de Março, 2026

*Formatura SaaS — Branch Protection Setup Complete*
