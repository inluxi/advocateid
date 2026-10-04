# /rules/git.md: Git commits, code review, and pre-push checklist

*Conventions for writing commits, conducting code reviews, and ensuring compliance before pushing.*

---

## 1. Commit conventions

### 1.1 Commit format

**Format:** `{type}({scope}): {subject}`

**Example:**
```
feat(auth): add OTP verification endpoint
```

**Types:**

| Type | Use for | Example |
|------|---------|---------|
| `feat` | New feature or page | `feat(search): add practice area filter` |
| `fix` | Bug fix | `fix(booking): correct phone number validation` |
| `refactor` | Code reorganization (no feature change) | `refactor(utils): extract phone-hashing logic` |
| `perf` | Performance improvement | `perf(search): add index on district_id` |
| `docs` | Documentation or comments | `docs(dpdp): add data retention table` |
| `test` | Tests only | `test(auth): add OTP hashing tests` |
| `chore` | Build, deps, config (no code change) | `chore(deps): update Next.js to 15.1` |
| `ci` | CI/CD pipeline changes | `ci(deploy): add staging environment to wrangler` |

**Scopes (examples):**
- `auth`: login, OTP, account
- `search`: search page, filters
- `profile`: advocate or firm page
- `db`: database, schema, migrations
- `api`: API endpoints
- `ui`: components, pages
- `seo`: sitemap, canonical, JSON-LD
- `dpdp`: compliance, consent, data deletion
- `analytics`: event recording, ranking

### 1.2 Subject line

- **Max 50 characters** (not including type and scope).
- **Imperative mood:** "add" not "added" or "adds".
- **No period** at the end.
- **Lowercase** first letter.

**✓ Good:**
```
feat(auth): add OTP verification endpoint
fix(search): correct district filter casing
refactor(db): extract migration helpers
```

**✗ Bad:**
```
feat(auth): Added OTP verification endpoint. (period, past tense)
fix(search): Correcting district filter casing (present participle)
refactor(db): Extracted migration helpers (past tense)
```

### 1.3 Commit body (for complex changes)

**If the commit is complex, add a body after a blank line:**

```
feat(dpdp): implement account deletion with 30-day grace period

- Add soft delete flag to accounts table
- Soft-deleted accounts can be restored within 30 days
- Nightly job hard-deletes accounts after 30 days
- Update /account/settings UI to show deletion status
- Add audit log entry for each deletion request

Fixes: #145
```

**Rules:**
- Body is optional for simple commits (one line subject is enough).
- Body is **required** for commits that touch multiple files or have complex logic.
- Explain **why**, not **what** (the diff shows what).
- Wrap lines at 72 characters.

### 1.4 References and closes

**Link to issues or PRs in the footer:**

```
Fixes: #42
Closes: #123
Related: #456
```

---

## 2. Secrets and credentials

### 2.1 Never commit secrets

**If you see a secret in a commit, it's compromised. Treat it as active breach.**

**Secrets include:**
- API keys (Cloudflare, OTP provider, payment gateway)
- Database passwords
- Private keys (SSL, signing)
- OAuth tokens
- Mobile numbers (test or real)

### 2.2 How to handle secrets

**✓ In Cloudflare secrets (environment):**
```toml
# wrangler.toml
[env.production]
vars = { DB_POOL_SIZE = "10" }

[[env.production.secrets]]
binding = "DB_PASSWORD"
# Value set via Cloudflare dashboard or `wrangler secret put`
```

**✓ In code (never hardcoded):**
```typescript
const dbPassword = env.DB_PASSWORD; // From Cloudflare secrets
const dbUrl = `postgresql://user:${dbPassword}@host/db`;
```

**✗ Never this:**
```typescript
const dbPassword = "super-secret-password-123"; // ❌ Exposed!
```

### 2.3 .gitignore rules

```gitignore
# Environment files
.env
.env.local
.env.production
.env.*.local

# Secrets
secrets/
*.key
*.pem
private_keys/

# Build and cache
node_modules/
.next/
dist/
build/
*.o
*.a
*.so

# IDE
.vscode/
.idea/
*.swp
*.swo

# OS
.DS_Store
Thumbs.db

# Logs
*.log
npm-debug.log*
yarn-debug.log*
lerna-debug.log*
```

### 2.4 Check before committing

```bash
# Check for secrets in staged changes
git diff --cached | grep -i "password\|api.key\|secret\|token"

# If found, STOP. Unstage and use Cloudflare secrets instead.

# Check git history for any previously-committed secrets
git log --all -p | grep -i "password" | head -5
```

---

## 3. Code review checklist

**Before approving or merging, verify:**

### 3.1 DPDP and compliance

- [ ] **New table with personal data?** Check `/rules/dpdp-checklist.md`.
  - Is there a retention period? Purge job?
  - Is personal data encrypted/hashed?
  - Is there audit logging?
- [ ] **New data collection (form, endpoint)?** Check notice and consent.
  - Privacy notice shown before collection?
  - Consent stored in `account_consents`?
  - User can withdraw or delete later?
- [ ] **New analytics event?** Check host tracking and visitor ID.
  - Is it recorded per host (advocateid.in vs custom domain)?
  - Using rotating visitor ID (not PII)?
  - No full IP addresses or device fingerprinting?
- [ ] **New personal data log?** Check for secrets/PII in console.
  - No mobile numbers, OTP, names logged?
  - No API keys in error messages?

### 3.2 Bar Council compliance

- [ ] **Text changes (bio, about, posts, highlights)?** Run banned-word check.
  - Any "best", "top", "winning", "guaranteed", "testimonial", "star", "fee"?
  - Wording is factual, not promotional?
- [ ] **New field (advocate or firm page)?** Field-by-field review (T2).
  - Does this field expose prohibited advertising?
  - Can it be toggled off if needed?
- [ ] **Case summaries or posts?** Factual outcomes only.
  - No client identification?
  - No "before/after" photos?
  - No outcome claims like "guaranteed win"?

### 3.3 SEO

- [ ] **New route or URL structure?** Check `/rules/seo.md`.
  - Is the canonical correct?
  - Should this page be indexable? Noindex? Why?
  - Does hreflang exist for /ml/ variant?
- [ ] **New page type (advocate, post, court)?** Check JSON-LD schema.
  - Does the schema validate?
  - Is it the right type (Attorney, Article, etc.)?
- [ ] **Sitemap or robots.txt change?** Verify no indexing conflicts.
  - Search filters noindex? (They should be.)
  - Login pages noindex? (They should be.)

### 3.4 Code quality

- [ ] **No SQL outside the repository layer.** All queries in Drizzle ORM or raw, in repo layer only.
- [ ] **Type safety.** TypeScript passes; no `any` unless justified.
- [ ] **Tests pass.** `npm run test` exits 0.
- [ ] **Linting passes.** `npm run lint` exits 0.
- [ ] **Build succeeds.** `npm run build` exits 0.
- [ ] **No circular imports or unused imports.**
- [ ] **Error handling.** Try-catch for async, proper error messages (no secrets).
- [ ] **Accessibility.** New UI is keyboard navigable and has sufficient contrast.

### 3.5 Performance

- [ ] **No N+1 queries.** (Batch loads, not loops with DB calls.)
- [ ] **Images optimized.** (Resized, compressed, WebP.)
- [ ] **API response size.** (Pagination for large lists.)
- [ ] **No third-party scripts without justification.** (Cloudflare, Google Search Console, GA4 with consent.)

### 3.6 Security

- [ ] **No hardcoded secrets.** Check for API keys, passwords.
- [ ] **CORS headers correct.** (Only allow trusted origins.)
- [ ] **CSRF protection.** (Forms have tokens; state-changing requests are POST.)
- [ ] **Rate limiting.** (OTP, report endpoints are rate-limited.)
- [ ] **Input validation.** (Slugs are a-z/digits/hyphen; phone numbers validated.)
- [ ] **Injection protection.** (No SQL injection; output escaped for XSS.)

### 3.7 Backwards compatibility

- [ ] **Database migration.** If schema changed, is there a safe migration path?
  - Can old code run with the new schema? (E.g., add nullable column first, then backfill.)
  - Is there a rollback plan?
- [ ] **API changes.** If breaking, is there a deprecation path?
  - Old endpoint works with warning? Or version bump?

### 3.8 Documentation

- [ ] **Code comments.** Complex logic explained (not obvious code).
- [ ] **Function docs.** JSDoc for public functions.
- [ ] **Database schema.** Column purposes documented.
- [ ] **API endpoints.** Request/response examples in the PR or README.

---

## 4. Pre-push checklist (before `git push`)

**Before pushing to `staging` or `main`:**

```bash
# 1. Run tests
npm run test
# If fails, fix and test again

# 2. Run linter
npm run lint
# If fails, fix style

# 3. Build
npm run build
# If fails, fix and rebuild

# 4. Check for secrets
git diff --staged origin/main..HEAD | grep -i "password\|api.key\|secret\|token"
# If found, STOP. Unstage and rewrite history.

# 5. Check for debugging code
git diff --staged origin/main..HEAD | grep "console\|debugger"
# If found, remove them

# 6. Check commit messages
git log --oneline origin/main..HEAD
# Are they clear and follow the format?

# 7. Verify tests still pass (final check)
npm run test -- --watch=false

# 8. All good? Push
git push origin {branch-name}
```

---

## 5. PR template

**When opening a PR, fill out the template:**

```markdown
## What does this PR do?

(Brief summary of the change)

## Why?

(Context: what problem does it solve or feature does it enable?)

## Checklist

- [ ] Tests pass (`npm run test`)
- [ ] Linting passes (`npm run lint`)
- [ ] Build succeeds (`npm run build`)
- [ ] No secrets committed (API keys, passwords)
- [ ] No console/debugger statements
- [ ] DPDP compliance verified (if personal data involved)
- [ ] Bar Council wording check done (if text changes)
- [ ] SEO canonical correct (if new route)
- [ ] Backwards compatible (or breaking change documented)

## Testing

(How did you test this? Manual steps? Unit tests?)

## Related issues

Fixes: #123
Related: #456

## Notes

(Any gotchas, workarounds, or follow-up tasks?)
```

---

## 6. Code review workflow

### 6.1 Opening a PR

1. **Push to a feature branch:** `git checkout -b feat/otp-endpoint`
2. **Run all checks locally:** (see pre-push checklist above)
3. **Open PR on GitHub/GitLab.**
4. **Fill out PR template.**
5. **Tag reviewers:** @ someone who knows this area.

### 6.2 Reviewing a PR

1. **Check the PR description:** Does it make sense?
2. **Run the checklist above** (3.1–3.8).
3. **Test locally if complex:** Pull the branch, run tests, try it.
4. **Leave comments:** Be specific ("line 42: this query N+1s" not "looks bad").
5. **Approve or request changes.**
6. **Re-review after author updates.**

### 6.3 Merging a PR

**Only merge if:**
- [ ] All checks pass (tests, lint, build).
- [ ] At least one approval (code review).
- [ ] No outstanding change requests.
- [ ] Commit messages are clean.

**Merge to `staging` first; test there; then merge to `main`.**

---

## 7. Branches and environments

| Branch | Environment | Access | Deploy trigger |
|--------|-------------|--------|---|
| `staging` | Staging | GitHub/GitLab UI | Auto-deploy on push (wrangler) |
| `main` | Production | GitHub/GitLab UI | Auto-deploy on push (wrangler) |
| Feature branches | Local | Developer | Manual `wrangler dev` |

**Naming convention:**
```
feat/otp-endpoint
fix/slug-redirect
refactor/auth-module
docs/dpdp-rules
```

---

## 8. Rewriting history (danger zone)

**Only rewrite history if:**
- Commits not yet pushed to `staging` or `main`.
- You're the only one working on the branch.

```bash
# Squash last 3 commits
git rebase -i HEAD~3

# Mark 2nd and 3rd as "squash" (s); keep 1st as "pick" (p)
# Save and edit the combined message

# Force push (only if not shared)
git push --force-with-lease
```

**Never rewrite `staging` or `main` history; use revert instead:**

```bash
# If a bad commit made it to main, revert it (new commit undoing the change)
git revert {commit-hash}
git push origin main
```

---

## 9. Accident recovery

### 9.1 Committed a secret

```bash
# If not yet pushed to staging/main:
git reset HEAD~1
# Unstage the secret
git rm --cached secret.txt
# Add to .gitignore
echo "secret.txt" >> .gitignore
# Recommit without secret
git add .
git commit -m "fix: remove secret from commit"

# If already pushed to staging/main:
# 1. Treat as breach. Change the secret immediately.
# 2. Rewrite history (force push only on feature branches; revert on main).
# 3. Run `git log` to ensure secret is gone.
# 4. Alert the team and founder.
```

### 9.2 Merged to main by accident

```bash
# If merge not yet pulled by others:
git revert {merge-commit-hash}
git push origin main

# If already pulled:
# Use revert above; do not rewrite history.
```

### 9.3 Pushed to wrong branch

```bash
# Oops, pushed to main instead of staging
git reset --soft origin/main~1
# Commits are back in staging area; changes not lost
git checkout staging
git push origin staging
```

---

## 10. Deploy workflow

### 10.1 Staging deploy

```bash
# Feature branch ready? Push to staging.
git checkout staging
git merge feat/{feature}
git push origin staging

# wrangler automatically deploys to staging environment.
# Visit https://advocateid.in/ and test.

# Found a bug? Fix on the feature branch, push again.
```

### 10.2 Production deploy

```bash
# Staging tested and approved? Merge to main.
git checkout main
git merge staging
git push origin main

# wrangler automatically deploys to production.
# Visit https://advocateid.in/ and verify.

# Hotfix needed?
# Cherry-pick to main (not merge main from staging).
git checkout main
git cherry-pick {commit-hash}
git push origin main
```

---

## 11. Rollback plan

**If production breaks:**

```bash
# Option 1: Revert the bad commit
git log --oneline -5 origin/main
# Find the bad commit
git revert {commit-hash}
git push origin main

# Option 2: Deploy a known-good commit
git reset --hard {good-commit-hash}
git push --force origin main
# (Force push only in true emergency; tell the team.)

# Option 3: Manual hotfix
# Branch from main, fix, push (takes time but safe)
git checkout main
git checkout -b hotfix/critical-bug
# Fix the code
git push origin hotfix/critical-bug
# Open PR, get approval, merge to main
```

---

## 12. Useful commands

```bash
# Check for uncommitted changes
git status

# View unstaged changes
git diff

# View staged changes
git diff --cached

# View last 5 commits
git log --oneline -5

# View commits affecting a file
git log --oneline -- {file}

# View a specific commit
git show {commit-hash}

# Stash uncommitted work (temporary save)
git stash
git stash pop

# Undo last commit (keep changes)
git reset --soft HEAD~1

# Undo last commit (discard changes)
git reset --hard HEAD~1

# Amend last commit (fix message or add files)
git add .
git commit --amend

# Check for secret patterns
git diff --cached | grep -iE "(password|api.key|secret|token|mobile|phone)" | head -10
```

---

## 13. Compliance for AI Code Generation

**If Claude Code or Claude generates a commit:**

1. **Review the generated code** (do not auto-approve).
2. **Check for secrets:** Run the secret check command above.
3. **Verify DPDP compliance:** If personal data involved, check `/rules/dpdp-checklist.md`.
4. **Check wording:** If text, run banned-word check against `/rules/bar-council-wording.md`.
5. **Test locally:** Build, test, lint before merging.
6. **Sign the commit** (if required by policy).

```bash
# Sign a commit with GPG (optional but good practice)
git config user.signingKey {key-id}
git commit -S -m "feat: add feature"
git push origin branch-name
```

---

## 14. Responsibility matrix

| Task | Who | Approval needed |
|------|-----|---|
| Feature development | Developer | Code review (1+ approver) |
| DPDP/compliance changes | Developer + Counsel | Counsel review (T6) + code review |
| Bar Council/wording changes | Developer + Counsel | Counsel review (T2) + code review |
| SEO/canonical changes | Developer | Code review (1+ approver) |
| Database migrations | Developer | Code review (1+ approver with DB experience) |
| Secrets/security changes | Developer | Code review + founder | (escalate if unsure) |
| Merging to main | Developer | Code review + Founder approval (launch only) |
| Production hotfixes | Developer | Founder approval + code review (urgent) |
