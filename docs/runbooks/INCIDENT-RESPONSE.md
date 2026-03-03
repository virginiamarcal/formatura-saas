# Incident Response Playbook — Formatura SaaS

**Version:** 1.0
**Last Updated:** 3 de Março, 2026
**Owner:** @devops (Gage)
**Status:** ⏳ Pre-Launch (Ready)

---

## 🚨 Overview

Este runbook define procedures para responder a diferentes tipos de incidentes em produção. Objetivo: minimizar tempo de detecção e resolução (MTTR).

**On-Call Contact:** @devops (Gage) via Slack #emergencies

---

## 1. Payment Processing Failure (🔴 CRITICAL)

**Severity:** P1 — Revenue impact
**Detection:** Sentry alert OR DataDog payment_success_rate < 80%
**Symptoms:**
- Payment API returns 500 errors
- ASAAS webhook not received
- Payment status stuck on "pending"

### Immediate Action (First 5 minutes)

1. **Acknowledge** incident in Slack #emergencies
   ```
   🚨 P1: Payment processing failing - investigating
   Detection: [alert source]
   Customers affected: ~[estimate]
   ```

2. **Verify scope** — Check DataDog dashboard
   ```
   Dashboard: prod-health → Payment success rate
   - If 0% success: Critical outage
   - If 50% success: Partial failure
   - Pattern: All payment amounts? Specific users? Specific event?
   ```

3. **Check ASAAS status** — https://asaas.statuspage.io/
   - [ ] ASAAS operational?
   - [ ] Webhooks enabled?
   - [ ] Webhook URL correct?

4. **Check logs** — Sentry + DataDog
   ```
   Sentry: Filter for "payment" errors
   DataDog: Check payment_operations metric
   Look for: Connection timeouts, auth failures, rate limiting
   ```

### Diagnosis (5-15 minutes)

**If ASAAS is down:**
- Post to Slack: "ASAAS is down — awaiting status"
- Set status page to "Degraded"
- Enable manual payment approval (temporary)
- Check back every 5 minutes

**If ASAAS is up but payments failing:**

```bash
# Check backend logs
railway logs --follow | grep -i payment

# Check database
psql $DATABASE_URL -c "
  SELECT COUNT(*), status FROM payments
  GROUP BY status ORDER BY COUNT(*) DESC LIMIT 5;
"

# Check webhook status
psql $DATABASE_URL -c "
  SELECT * FROM financial_transactions
  WHERE type='webhook_payment' AND created_at > NOW() - interval '5 min'
  ORDER BY created_at DESC LIMIT 10;
"
```

**If rate limiting:**
- Check ASAAS API logs for 429 errors
- Reduce request rate if possible
- Contact ASAAS support if limit exceeded

**If authentication:**
```bash
# Verify ASAAS_API_KEY in Railway
railway env list | grep ASAAS_API_KEY

# Check if key is valid (try test request)
curl -H "Authorization: Bearer ${ASAAS_API_KEY}" \
  https://api.asaas.com/v3/accounts
```

### Resolution

**Option A: Quick Fix (if identified)**
- Fix configuration issue
- Redeploy backend
- Monitor next 10 payments

**Option B: Rollback**
```bash
# If recent deployment caused it
git log --oneline | head -5
git revert {bad-commit-hash}
git push origin main
# Vercel + Railway auto-deploy
# Monitor health check
```

**Option C: Manual Workaround**
- [ ] Pause automatic invoice generation
- [ ] Manual payment approval in admin dashboard
- [ ] Notify students: "Payments temporarily manual"
- [ ] Create ticket for permanent fix

### Escalation (After 15 minutes if unresolved)

```
Contact: @devops (Gage)
If unavailable → Contact @pm (Morgan) or @architect (Aria)
Decision: Fix vs. Rollback vs. Manual mode
```

### Post-Incident (After resolution)

1. Update DataDog: Verify success rate back to >95%
2. Count affected transactions:
   ```bash
   psql $DATABASE_URL -c "
     SELECT COUNT(*) FROM payments
     WHERE status='failed' AND updated_at > NOW() - interval '30 min';
   "
   ```
3. Document root cause
4. Create follow-up issue (e.g., "Add circuit breaker for ASAAS")
5. Send summary to #incidents:
   ```
   ✅ P1 RESOLVED: Payment Processing
   Duration: [X minutes]
   Affected: [Y payments]
   Root cause: [Brief explanation]
   Fix: [What was done]
   Prevention: [What we'll do to prevent]
   ```

---

## 2. Database Down (🔴 CRITICAL)

**Severity:** P1 — Complete service outage
**Detection:** DataDog connection_errors spiking OR Sentry 500 errors
**Symptoms:**
- All API endpoints return 500
- Database connection timeout
- Supabase dashboard shows red alert

### Immediate Action (First 2 minutes)

1. **Check Supabase Status** — https://status.supabase.com/
   - [ ] Status page shows incident?
   - [ ] Status: "All systems operational"?

2. **Check connection string** — Railway backend logs
   ```bash
   railway logs --follow | grep -i "connection"
   ```

3. **Check database connectivity**
   ```bash
   psql $DATABASE_URL -c "SELECT 1;"
   # If connection refused → Supabase issue
   # If connection timeout → Network issue
   ```

4. **Verify network access**
   ```bash
   # From Railway backend
   railway ssh
   nc -zv $DB_HOST 5432
   ```

### Diagnosis

**If Supabase status page shows incident:**
- Post to Slack: "Supabase experiencing incident — awaiting resolution"
- Status page: "Degraded Service"
- Estimated impact: ~all users unable to load data
- Check back every 2 minutes

**If Supabase operational but can't connect:**
```bash
# Check connection pool status
railway env list | grep DATABASE_URL

# Test connection directly
psql "postgresql://user:password@host:port/db" -c "SELECT 1;"

# If pool exhausted
psql $DATABASE_URL -c "
  SELECT datname, count(*) FROM pg_stat_activity
  GROUP BY datname;
"
```

**If connection pool exhausted:**
- [ ] Check for hung queries
- [ ] Kill long-running queries
- [ ] Restart connection pool (if available)
- [ ] Deploy new backend version with timeout

### Resolution

**If Supabase is down (waiting):**
- Monitor status page
- Update customers every 10 min
- No action needed from us — wait for Supabase

**If connection pool issue:**
```bash
# Kill hung transactions (older than 1 hour)
psql $DATABASE_URL -c "
  SELECT pg_terminate_backend(pid) FROM pg_stat_activity
  WHERE query_start < NOW() - interval '1 hour'
  AND pid <> pg_backend_pid();
"
```

**If credentials wrong:**
```bash
# Update DATABASE_URL in Railway
railway env set DATABASE_URL="postgresql://..."
railway redeploy
```

### Escalation

Contact @data-engineer (Dara) for database-specific issues, or @devops (Gage) for infrastructure.

---

## 3. API Unresponsive (🟠 HIGH)

**Severity:** P2 — Degraded service
**Detection:** Response time > 5s OR error rate > 10%
**Symptoms:**
- Page loads slowly
- API requests timeout
- DataDog shows high latency spikes

### Immediate Action (First 5 minutes)

1. **Check server status** — Railway dashboard
   - [ ] CPU usage > 80%?
   - [ ] Memory usage > 80%?
   - [ ] Recent deployment?

2. **Check recent deployments**
   ```bash
   git log --oneline | head -3
   ```

3. **Check for slow queries** — DataDog
   ```
   Dashboard: db.query.duration
   - Queries taking > 1s?
   - N+1 query pattern?
   ```

4. **Check traffic** — DataDog
   ```
   Dashboard: http.requests (count)
   - Unusual spike?
   - DDoS attack indicators?
   ```

### Diagnosis

**If CPU spiking:**
- Likely inefficient query or infinite loop
- Check Sentry for errors
- Check DataDog for slow queries

**If memory spiking:**
- Likely memory leak
- Check for unclosed connections
- Check for stuck async operations

**If no resource issues:**
- Check for recent deployment
- Check database performance
- Check external API latency (ASAAS, etc)

### Resolution

**Quick Fix (if identified):**
- Fix slow query
- Optimize algorithm
- Redeploy with fix

**Rollback (if recent deployment caused it):**
```bash
git revert {bad-commit-hash}
git push origin main
# Auto-deploy to previous version
```

**Scaling (if legitimate traffic spike):**
```bash
# Increase Railway dyno size
railway env set RAILWAY_SCALE_TYPE="performance"
railway redeploy
```

---

## 4. Webhook Delivery Failure (🟠 HIGH)

**Severity:** P2 — Data inconsistency risk
**Detection:** DataDog webhook_asaas_reliability < 95%
**Symptoms:**
- Payment webhook not received
- Contract signature webhook not received
- Payment status not updated in database

### Immediate Action (First 5 minutes)

1. **Check ASAAS webhook logs**
   - [ ] ASAAS dashboard → Webhooks → Recent deliveries
   - [ ] Status: "Success" or "Failed"?
   - [ ] Error message?

2. **Check backend logs** — Sentry
   ```
   Filter for webhook_* errors
   Recent 5 minutes
   ```

3. **Verify webhook URL**
   ```bash
   # Check ASAAS configuration
   ASAAS dashboard → Settings → Webhooks
   Expected: https://api.formatura.com/webhooks/asaas
   ```

### Diagnosis

**If ASAAS shows failed delivery:**
- Check error message
- Common: "Connection refused" → Backend down
- Common: "Timeout" → Backend slow
- Common: "401 Unauthorized" → Auth header wrong

**If ASAAS shows success but we didn't receive:**
- Check backend logs for incoming webhook
- Verify signature validation not blocking
- Check database transaction commit

### Resolution

**If backend down:**
- Restart Railway service
- Monitor health check
- Verify webhook retry (ASAAS will retry)

**If URL wrong:**
- Update in ASAAS dashboard
- Request manual webhook re-delivery
- Monitor for successful delivery

**If signature validation failing:**
```bash
# Check webhook secret in Railway
railway env list | grep ASAAS_WEBHOOK_SECRET

# Verify matches ASAAS dashboard
ASAAS Settings → Webhooks → Secret key
```

---

## 5. RLS Policy Blocking Legitimate Access (🟠 HIGH)

**Severity:** P2 — User unable to access data
**Detection:** User reports "Permission Denied" error
**Symptoms:**
- Student cannot view own payment schedule
- Committee member cannot view event data
- Admin operations blocked

### Immediate Action (First 5 minutes)

1. **Get affected user info**
   - User ID
   - Event ID
   - What were they trying to access?

2. **Reproduce in database**
   ```bash
   psql $DATABASE_URL -c "
     SET SESSION 'request.jwt.claims' =
       '{\"sub\": \"$USER_ID\", \"role\": \"authenticated\"}';
     SELECT * FROM payment_schedules
     WHERE id = '$RESOURCE_ID';
   "
   ```

3. **Check RLS policy**
   ```bash
   psql $DATABASE_URL -c "
     SELECT * FROM pg_policies
     WHERE tablename = 'payment_schedules'
     AND schemaname = 'public';
   "
   ```

### Diagnosis

**If RLS policy is too restrictive:**
- Review policy logic
- Verify it matches acceptance criteria
- Create test case

**If user role is wrong:**
- Check user_roles table
- Verify user_id matches
- Verify role value matches policy

### Resolution

**If policy needs adjustment:**
- Review with @data-engineer (Dara)
- Create fix in migration
- Test thoroughly before deploy
- Communicate timeline to affected users

**If user role needs fix:**
```bash
# Manually fix user role (emergency only)
psql $DATABASE_URL -c "
  UPDATE user_roles SET role = 'committee'
  WHERE user_id = '$USER_ID' AND event_id = '$EVENT_ID';
"
# Document in incident report
```

---

## 6. SSL Certificate Expiring Soon (🟡 MEDIUM)

**Severity:** P3 — Prevention
**Detection:** Automated alerts from certificate provider OR manual check
**Symptoms:**
- Browser shows certificate expiration warning
- Security scanners flag expiration date

### Immediate Action

1. **Check certificate expiration**
   ```bash
   openssl s_client -connect prod.formatura.com:443 -servername prod.formatura.com | \
   openssl x509 -noout -dates
   ```

2. **Check Vercel + Railway certificates**
   - Vercel: Settings → SSL/TLS → View certificate
   - Railway: Should auto-renew (Let's Encrypt)

### Resolution

**Vercel (Next.js):**
- Vercel auto-renews certificates
- No action needed typically
- Monitor Settings → SSL/TLS

**Railway (Express):**
- Should auto-renew if custom domain
- If not: Contact Railway support
- As fallback: API endpoint via Vercel proxy

---

## Response Time Targets

| Severity | Detection | Response | Resolution |
|----------|-----------|----------|------------|
| 🔴 P1 | <5 min | <2 min | <30 min |
| 🟠 P2 | <10 min | <5 min | <2 hours |
| 🟡 P3 | <1 hour | <15 min | <1 day |

---

## Escalation Contact Tree

```
⏰ During Business Hours (9am-5pm):
  L1: @devops (Gage) - Primary
  L2: @architect (Aria) - Infrastructure decisions
  L3: @pm (Morgan) - Business impact decisions

⏰ After Hours / Weekend:
  L1: @devops on-call
  L2: @architect on-call
  Emergency: @pm (CEO decision)
```

---

## Communication Template

### To Slack #emergencies

```
🚨 INCIDENT: [Title]
├─ Severity: [P1/P2/P3]
├─ Started: [Time]
├─ Status: [Investigating/In Progress/Resolved]
├─ Impact: [Brief description]
└─ ETA Resolution: [Estimate]
```

### To Customer (if needed)

```
🔧 We're experiencing a temporary issue with [Service]

What's happening: [Brief, non-technical explanation]
Who's affected: [% of users / specific users]
What we're doing: [Brief explanation of fix]
ETA: [When should be fixed]

We appreciate your patience!
```

---

## Post-Incident Review Template

**File:** `docs/incidents/incident-{date}-{title}.md`

```markdown
# Incident Report: [Title]

**Date:** [Date/Time]
**Duration:** [X minutes]
**Severity:** [P1/P2/P3]

## What Happened
[1-2 sentences describing the incident]

## Timeline
- 14:32 - Alert fired
- 14:35 - Acknowledged
- 14:50 - Root cause identified
- 15:10 - Fix deployed
- 15:15 - Verified resolved

## Root Cause
[Why did this happen?]

## Impact
- Affected users: ~[X]%
- Data loss: [Yes/No]
- Revenue impact: $[X]

## Resolution
[What we did to fix it]

## Prevention
[What we'll do to prevent this in future]

## Action Items
- [ ] Item 1
- [ ] Item 2

**Owner:** [Name]
**Due:** [Date]
```

---

**Status:** ✅ Ready for Production

*Formatura SaaS — Incident Response Playbook Complete*
