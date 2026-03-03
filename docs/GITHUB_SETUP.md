# GitHub Repository Setup — Formatura SaaS

## Overview

This document describes the GitHub repository setup and CI/CD configuration for Formatura SaaS.

## Repository Details

- **Repository:** https://github.com/virginiamarcal/formatura-saas
- **Owner:** virginiamarcal
- **Default Branch:** main
- **Visibility:** Public

## Branch Protection Rules

The `main` branch is protected with the following rules:

- **Require status checks:** All CI/CD checks must pass before merging
  - Linting (`lint`)
  - Type checking (`typecheck`)
  - Tests (`test`)
  - Build (`build`)
- **Require pull request reviews:** At least 1 approval required before merging
- **Dismiss stale reviews:** Stale reviews are automatically dismissed when new commits are pushed
- **Enforce for administrators:** Protection rules apply to all users, including administrators
- **Block force pushes:** Force pushes to main are not allowed
- **Block branch deletions:** The main branch cannot be deleted

## CI/CD Pipeline

### GitHub Actions Workflows

All workflows are configured in `.github/workflows/ci.yml` and run on:
- Push to `main` or `develop` branches
- Pull requests against `main` or `develop` branches

### Pipeline Stages

1. **Lint** — Code style validation
   - Runs `npm run lint`
   - Must pass before PR can be merged

2. **Type Check** — TypeScript type validation
   - Runs `npm run typecheck`
   - Must pass before PR can be merged

3. **Test** — Unit and integration tests
   - Runs `npm test`
   - Must pass before PR can be merged

4. **Build** — Production build verification
   - Runs `npm run build`
   - Must pass before PR can be merged

All stages run in parallel for faster feedback. Node.js 20 is used for all jobs.

## GitHub Secrets Configuration

The following secrets can be configured in the repository settings for use in CI/CD workflows or application code:

### Required Secrets (for future implementation)

To set secrets, use:
```bash
gh secret set SECRET_NAME --body 'your-secret-value'
```

#### ASAAS Integration
- **`ASAAS_API_KEY`** — API key for ASAAS payment processing
  - Required for payment invoice generation and reconciliation
  - Get from: https://api.asaas.com

#### WhatsApp Integration
- **`WHATSAPP_API_KEY`** — API key for WhatsApp messaging
  - Required for automated notifications to students and vendors
  - Get from: WhatsApp Business API

#### Google Calendar Integration (Optional)
- **`GOOGLE_CALENDAR_API_KEY`** — API key for Google Calendar
  - Required for timeline synchronization
  - Get from: Google Cloud Console

### Setting Secrets

```bash
# Example: Set ASAAS API key
gh secret set ASAAS_API_KEY --body 'your-actual-api-key'

# List all secrets (shows names only)
gh secret list
```

## Development Workflow

### Creating a Feature Branch

```bash
git checkout -b feature/your-feature-name
```

### Making Changes

1. Make your code changes
2. Run local quality checks:
   ```bash
   npm run lint      # Check code style
   npm run typecheck # Check TypeScript types
   npm test          # Run tests
   npm run build     # Build for production
   ```

### Committing Changes

Use conventional commit messages:
```bash
git add .
git commit -m "feat: add new feature"
```

Conventional commit types:
- `feat:` — New feature
- `fix:` — Bug fix
- `chore:` — Build, CI/CD, dependencies
- `docs:` — Documentation changes
- `refactor:` — Code refactoring
- `test:` — Test additions/changes
- `style:` — Code formatting

### Creating a Pull Request

```bash
# Push your branch
git push origin feature/your-feature-name

# Create PR
gh pr create --title "feat: add new feature" --body "Description of changes"
```

The PR will automatically:
1. Run all CI/CD checks
2. Require at least 1 approval
3. Show test results and coverage

Once approved and all checks pass, you can merge:

```bash
gh pr merge --squash
```

## Deployment

Currently, the main branch CI/CD pipeline only validates code quality. Deployment workflows can be added when needed:

- Staging deployment on PR merge to `develop`
- Production deployment on PR merge to `main`

## Next Steps

1. **Configure API Secrets:**
   - ASAAS API key for payment integration
   - WhatsApp API key for notifications
   - Google Calendar API key (optional)

2. **Add Real Testing:**
   - Replace `npm test` placeholder with actual test suite
   - Add code coverage metrics

3. **Add Linting & Type Checking:**
   - Install ESLint and configure rules
   - Add TypeScript support and configuration

4. **Setup Monitoring:**
   - Add GitHub status checks notifications
   - Configure Slack/email alerts for CI/CD failures

## Troubleshooting

### CI/CD Pipeline Failures

1. **Lint failures:** Check `.eslintrc` configuration and fix code style issues
2. **Type check failures:** Check for TypeScript errors in your code
3. **Test failures:** Review test logs and fix failing tests
4. **Build failures:** Check build output and resolve compilation errors

### Merging Blocked

If a PR merge is blocked, ensure:
1. All required status checks have passed
2. At least 1 approval has been given
3. No conflicts with the base branch

### Debugging Locally

To debug CI/CD issues locally, you can run the same commands:

```bash
# Run all checks in order
npm run lint && npm run typecheck && npm test && npm run build
```

## References

- [GitHub CLI Documentation](https://cli.github.com/manual/)
- [GitHub Actions Documentation](https://docs.github.com/en/actions)
- [GitHub Branch Protection](https://docs.github.com/en/repositories/configuring-branches-and-merges-in-your-repository/defining-the-mergeability-of-pull-requests)
