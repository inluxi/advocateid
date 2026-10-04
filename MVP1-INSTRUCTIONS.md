# MVP1-INSTRUCTIONS.md: Build roadmap for advocateid.in MVP 1

*Actionable breakdown of MVP 1 features, phases, acceptance criteria, and deployment. Read `PROJECT_REQUIREMENTS_v6.md` and `TECHNICAL_STACK_MODIFICATION_LOG.md` first for context.*

**Updated tech stack:** Hetzner/CloudPE VPS + k3s + Helm + ArgoCD (not Cloudflare Workers). See section 0.1 for the architecture.

---

## 0. MVP 1 scope and architecture

### 0.0 MVP 1 feature scope

**Goal:** Launch a fully-functional, DPDP-compliant, SEO-optimized advocate directory with OTP login, pages, search, posts, custom domains, and event tracking.

**In MVP 1:** Core directory, search, profiles, posts, custom domains, DPDP compliance, Bar Council rules, event tracking, sitemap/SEO.

**Out of MVP 1:** Payments, owner analytics dashboard, jobs, reviews, verified seal, ratings, bar associations.

### 0.1 Technical stack (v6.1 modified)

**Not Cloudflare Workers. Instead:**

```
VPS (CloudPE ₹930/month, 4GB RAM, 1 vCore)
    ↓
k3s (Lightweight Kubernetes)
    ↓
Helm Charts (Infrastructure as Code)
    ├─ helm/infra/ — NGINX Ingress, cert-manager, ArgoCD, RBAC
    └─ helm/app/ — Next.js application deployment
    ↓
ArgoCD (GitOps auto-sync from Git)
    ↓
NGINX Ingress Controller (routing for *.advocateid.in + custom domains)
    ↓
cert-manager + Let's Encrypt (automatic TLS certificates)
    ↓
Render PostgreSQL (external managed database)
    ↓
Firebase Storage (images; resized in browser, uploaded in background)
    ↓
Cloudflare DNS (domain management, CNAME targets)
```

**Deployment flow:**
```
Developer pushes code to git
    ↓
GitHub Actions builds Docker image, pushes to Docker Hub
    ↓
GitHub Actions updates helm/app/values.yaml (new image tag)
    ↓
ArgoCD polls every 3 minutes, detects git change
    ↓
ArgoCD runs: helm upgrade app ./helm/app/
    ↓
Kubernetes applies rolling update (zero downtime)
    ↓
New pods start, old pods terminate
    ↓
Users see new code live (~5-10 minutes after push)
```

**Why this stack (see TECHNICAL_STACK_MODIFICATION_LOG.md):**
- Portable: k3s runs on any VPS; not locked to Cloudflare
- Cheaper: ~$11-20/month vs $30/month (Cloudflare)
- Custom domains ready: cert-manager handles Let's Encrypt automation
- GitOps: one `git push` deploys everything; audit trail in Git
- Scalable: add VPS nodes; horizontal Pod Autoscaler

---

## 1. Phase 0: Foundation and infrastructure 

### 1.0 VPS and k3s cluster setup

**Task:** Provision VPS and install Kubernetes (k3s).

**VPS provisioning:**
- Cloud provider: CloudPE (₹930/month; India-based) or Hetzner
- Specs: 4 GB RAM, 1 vCore, 30 GB NVMe, unlimited bandwidth
- OS: Ubuntu 24.04 LTS
- SSH access configured; root user available
- Static public IP assigned

**k3s installation (1-click):**
```bash
# SSH into VPS
ssh root@{VPS_IP}

# Run k3s installer (downloads ~40MB binary)
curl -sfL https://get.k3s.io | sh -

# Verify cluster is running
kubectl get nodes  # Should show 1 ready node

# Save kubeconfig locally for remote access
scp root@{VPS_IP}:/etc/rancher/k3s/k3s.yaml ~/.kube/config
```

**Acceptance criteria:**
- [ ] VPS online and responding to ping.
- [ ] k3s installed; `kubectl get nodes` shows 1 ready node.
- [ ] kubeconfig downloaded; remote `kubectl` commands work from laptop.
- [ ] Cluster ready for Helm installations.

**Effort:** 0.5 days (mostly waiting for VPS provisioning)

---

### 1.1 Helm and infrastructure setup

**Task:** Install Helm charts for NGINX Ingress, cert-manager, and ArgoCD.

**Helm installations (in order):**

1. **NGINX Ingress Controller**
   ```bash
   helm repo add ingress-nginx https://kubernetes.github.io/ingress-nginx
   helm repo update
   helm install ingress-nginx ingress-nginx/ingress-nginx \
     --namespace ingress-nginx --create-namespace \
     --set controller.service.type=LoadBalancer
   ```
   - Listens on ports 80 (HTTP) and 443 (HTTPS)
   - Exposes the LoadBalancer IP (your VPS public IP)

2. **cert-manager (Let's Encrypt + automatic renewal)**
   ```bash
   helm repo add jetstack https://charts.jetstack.io
   helm repo update
   helm install cert-manager jetstack/cert-manager \
     --namespace cert-manager --create-namespace \
     --set installCRDs=true
   ```
   - Manages TLS certificates automatically
   - Renews 30 days before expiry

3. **ArgoCD (GitOps)**
   ```bash
   helm repo add argocd https://argoproj.github.io/argo-helm
   helm repo update
   helm install argocd argocd/argo-cd \
     --namespace argocd --create-namespace
   ```
   - Watches Git repo for changes
   - Auto-syncs every 3 minutes
   - Accessible at `argocd.{VPS_IP}.nip.io` (for initial setup)

**Acceptance criteria:**
- [ ] NGINX Ingress controller pod running: `kubectl get pods -n ingress-nginx`
- [ ] cert-manager pods running: `kubectl get pods -n cert-manager`
- [ ] ArgoCD pods running: `kubectl get pods -n argocd`
- [ ] LoadBalancer IP assigned to NGINX service

**Effort:** 1 day (testing + troubleshooting)

---

### 1.2 DNS and domain setup

**Task:** Point domain to VPS and configure subdomains.

**DNS configuration (at Cloudflare or registrar):**

1. **A record for main domain:**
   ```
   advocateid.in    A    {VPS_PUBLIC_IP}
   ```

2. **CNAME for wildcard (for custom domains and premium subdomains):**
   ```
   *.advocateid.in    CNAME    advocateid.in
   ```
   - This catches `*.p.advocateid.in` (premium CNAME targets)
   - Also catches any future custom domain CNAME (e.g., `example.com` → `example-law.p.advocateid.in`)

3. **Optional: Cloudflare Proxy**
   - If using Cloudflare DNS: keep "Proxied" enabled for DDoS protection
   - Origin server certificate: handled by cert-manager (Let's Encrypt)

**Acceptance criteria:**
- [ ] `nslookup advocateid.in` returns VPS IP
- [ ] `nslookup test.advocateid.in` returns VPS IP (wildcard working)
- [ ] HTTPS works: `curl https://advocateid.in` (may show cert warning until app is deployed)

**Effort:** 0.5 days (DNS propagation can take 24–48 hours)

---

### 1.3 Database setup (Render PostgreSQL)

**Task:** Create managed PostgreSQL database (external, not in k3s).

**Render setup:**
- Go to https://render.com
- Create account (free tier available)
- Create new PostgreSQL database
  - Name: `advocateid-mvp1`
  - Region: Asia (Singapore or India if available)
  - Plan: FREE tier (sufficient for MVP 1)
- Database connection string example:
  ```
  postgresql://user:password@host:5432/advocateid-mvp1
  ```

**Store credentials:**
- Save connection string in Kubernetes Secret (not in code)
- Use `kubectl create secret` or store in vault (MVP 2)

**Acceptance criteria:**
- [ ] Database created and online
- [ ] Connection string noted
- [ ] Can connect from local laptop with psql or DBeaver
- [ ] Secret created in Kubernetes: `kubectl get secret db-credentials`

**Effort:** 0.5 days

**Schema modules (from PROJECT_REQUIREMENTS_v6.md section 7):**

1. **Core accounts and pages**
   - `accounts` (mobile, status, created_at, deleted_at)
   - `pages` (id, account_id, type, slug, name, plan, status, district_id, bio, about, photo_key, banner_key, completeness, score, language, created_at, updated_at, deleted_at)
   - `page_advocate` (page_id, enrolment_no, year_enrolled, deleted_at)
   - `page_firm` (page_id, established_year, deleted_at)

2. **Reference data** (seeded by admin CSV)
   - `localities` (id, code, name, local_name, parent_id, level, lat, lng)
   - `courts` (id, code, name, kind, locality_id, address, lat, lng, deleted_at)
   - `court_translations` (court_id, language, name)
   - `court_details` (id, court_id, sort, key_name, value)
   - `categories` (id, code, slug, name, deleted_at)

3. **Content (lists)**
   - `page_courts` (page_id, court_id, sort, deleted_at)
   - `page_categories` (page_id, category_id, sort, deleted_at)
   - `page_languages` (page_id, language_code, deleted_at)
   - `career_entries` (id, page_id, year_from, year_to, title, institution, description, sort, deleted_at)
   - `highlights` (id, page_id, number, label, sort, deleted_at)
   - `page_links` (id, page_id, url, icon_key, sort, deleted_at)
   - `case_summaries` (id, page_id, court_id, role, year, outcome, note, link, post_id, sort, deleted_at)
   - `offices` (id, page_id, name, is_main, address, locality_id, phone, phone_verified, about, lat, lng, sort, deleted_at)
   - `office_courts` (office_id, court_id, sort, deleted_at)

4. **Memberships**
   - `memberships` (id, firm_page_id, advocate_page_id, title, office_id, status, firm_sort, office_sort, intro, created_at, updated_at, deleted_at)

5. **Posts and updates**
   - `posts` (id, page_id, type [article/court_update], title, body, cover_image_key, source_url, court_id, language, status, created_at, updated_at, deleted_at)
   - `post_categories` (post_id, category_id, sort)

6. **Analytics and tracking**
   - `page_events_raw` (id, page_id, host, visitor_id, event_type, context, action, is_owner, is_bot, created_at)
   - `page_daily_events` (id, page_id, host, day, impressions, views, connects, created_at)

7. **Search index**
   - `search_index` (id, page_id, office_id, type [page/office], district_code, locality_codes, category_codes, court_codes, language_codes, years, lat, lng, score, last_active)

8. **DPDP compliance**
   - `otp_logs` (id, mobile_hash, otp_hash, attempts, created_at, deleted_at)
   - `account_consents` (id, account_id, type, consented_at, withdrawn_at, deleted_at)
   - `audit_log` (id, action, resource_type, resource_id, actor_id, actor_type, reason, timestamp)

9. **Admin**
   - `domains` (id, page_id, hostname, status, cloudflare_id, created_at, updated_at, deleted_at)
   - `slug_history` (id, page_id, old_slug, new_slug, from, to, reason)
   - `page_photos` (id, page_id, r2_key, filename, size_bytes, created_at, deleted_at)
   - `reports` (id, target_type, target_id, reason, status, created_at, resolved_at)
   - `grievances` (id, name, contact_hash, subject, message, status, created_at, updated_at)

**Acceptance criteria:**
- [ ] All tables created via Drizzle ORM migration.
- [ ] Indexes added: `pages.slug`, `pages.district_id`, `pages.status`, `search_index.lat/lng`, `otp_logs.mobile_hash`.
- [ ] Soft-delete (`deleted_at`) on all personal-data tables.
- [ ] Schema review passed (no Postgres-only functions; portable to MySQL).

**Effort:** 3 days (1 dev + 1 DBA review)

---

### 1.4 Docker image and CI/CD setup

**Task:** Create Dockerfile, build image, and configure GitHub Actions for auto-builds.

**Dockerfile** (`Dockerfile` at repo root):
```dockerfile
FROM node:18-alpine

WORKDIR /app

# Copy package files
COPY package.json package-lock.json ./

# Install dependencies
RUN npm ci

# Copy source code
COPY src/ ./src
COPY public/ ./public
COPY tsconfig.json next.config.js ./

# Build Next.js app
RUN npm run build

# Expose port 3000
EXPOSE 3000

# Start app
CMD ["npm", "start"]
```

**GitHub Actions workflow** (`.github/workflows/deploy.yml`):
```yaml
name: Build and Deploy

on:
  push:
    branches: [staging, main]

jobs:
  build:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      
      # Build Docker image
      - name: Build image
        run: docker build -t advocateid:${{ github.sha }} .
      
      # Push to Docker Hub
      - name: Push to Docker Hub
        run: |
          echo ${{ secrets.DOCKER_PASSWORD }} | docker login -u ${{ secrets.DOCKER_USERNAME }} --password-stdin
          docker tag advocateid:${{ github.sha }} advocateid/advocateid-in:latest
          docker tag advocateid:${{ github.sha }} advocateid/advocateid-in:${{ github.sha }}
          docker push advocateid/advocateid-in:latest
          docker push advocateid/advocateid-in:${{ github.sha }}
      
      # Update Helm values with new image tag
      - name: Update Helm values
        run: |
          sed -i "s|image:.*|image: advocateid/advocateid-in:${{ github.sha }}|g" helm/app/values.yaml
          git config user.name "GitHub Actions"
          git config user.email "actions@github.com"
          git add helm/app/values.yaml
          git commit -m "chore: update image tag to ${{ github.sha }}"
          git push
```

**Acceptance criteria:**
- [ ] Dockerfile builds successfully: `docker build -t advocateid:latest .`
- [ ] Image runs locally: `docker run -p 3000:3000 advocateid:latest`
- [ ] GitHub Actions secrets configured (DOCKER_USERNAME, DOCKER_PASSWORD)
- [ ] First image pushed to Docker Hub
- [ ] Helm values auto-updated on push

**Effort:** 1 day

---

### 1.5 Helm app chart and ArgoCD setup

**Task:** Create Helm chart for Next.js app and configure ArgoCD to deploy.

**Helm app chart structure** (`helm/app/`):
```
helm/app/
  Chart.yaml          # Name, version, description
  values.yaml         # Default values (image tag, replicas, etc.)
  templates/
    deployment.yaml   # Kubernetes Deployment (Next.js pods)
    service.yaml      # Kubernetes Service (internal networking)
    ingress.yaml      # Ingress (expose to internet; TLS via cert-manager)
    configmap.yaml    # ConfigMaps (environment variables)
    hpa.yaml          # HorizontalPodAutoscaler (auto-scale based on CPU)
```

**Key templates:**

`templates/deployment.yaml`:
```yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: {{ .Release.Name }}-app
spec:
  replicas: {{ .Values.replicaCount }}
  selector:
    matchLabels:
      app: {{ .Release.Name }}
  template:
    metadata:
      labels:
        app: {{ .Release.Name }}
    spec:
      containers:
      - name: app
        image: "{{ .Values.image.repository }}:{{ .Values.image.tag }}"
        imagePullPolicy: Always
        ports:
        - containerPort: 3000
        env:
        - name: DATABASE_URL
          valueFrom:
            secretKeyRef:
              name: db-credentials
              key: url
        - name: NODE_ENV
          value: "production"
        resources:
          requests:
            cpu: 100m
            memory: 256Mi
          limits:
            cpu: 500m
            memory: 512Mi
```

`templates/ingress.yaml`:
```yaml
apiVersion: networking.k8s.io/v1
kind: Ingress
metadata:
  name: {{ .Release.Name }}-ingress
  annotations:
    cert-manager.io/cluster-issuer: "letsencrypt-prod"
    kubernetes.io/ingress.class: "nginx"
spec:
  ingressClassName: nginx
  tls:
  - hosts:
    - advocateid.in
    - "*.advocateid.in"
    - "*.p.advocateid.in"
    secretName: advocateid-tls
  rules:
  - host: advocateid.in
    http:
      paths:
      - path: /
        pathType: Prefix
        backend:
          service:
            name: {{ .Release.Name }}-service
            port:
              number: 3000
  - host: "~^.*\\.p\\.advocateid\\.in$"  # Wildcard for premium domains
    http:
      paths:
      - path: /
        pathType: Prefix
        backend:
          service:
            name: {{ .Release.Name }}-service
            port:
              number: 3000
```

`values.yaml`:
```yaml
replicaCount: 2

image:
  repository: advocateid/advocateid-in
  tag: "latest"  # Auto-updated by GitHub Actions
  pullPolicy: Always

service:
  type: ClusterIP
  port: 3000

ingress:
  enabled: true
  hosts:
    - advocateid.in
    - "*.p.advocateid.in"

autoscaling:
  enabled: true
  minReplicas: 2
  maxReplicas: 5
  targetCPUUtilizationPercentage: 70
```

**ArgoCD Application** (create after ArgoCD is installed):
```bash
# Create ArgoCD Application to watch Git repo
kubectl apply -f - <<EOF
apiVersion: argoproj.io/v1alpha1
kind: Application
metadata:
  name: advocateid
  namespace: argocd
spec:
  project: default
  source:
    repoURL: https://github.com/{owner}/advocateid-in.git
    targetRevision: main
    path: helm/app
  destination:
    server: https://kubernetes.default.svc
    namespace: default
  syncPolicy:
    automated:
      prune: true
      selfHeal: true
    syncOptions:
    - CreateNamespace=true
  revisionHistoryLimit: 5
EOF
```

**Acceptance criteria:**
- [ ] Helm chart validates: `helm lint helm/app/`
- [ ] Dry run succeeds: `helm install test helm/app/ --dry-run --debug`
- [ ] ArgoCD Application created and syncing
- [ ] Pods running: `kubectl get pods` shows `advocateid-app-*`
- [ ] App accessible: `curl http://advocateid.in` (via ingress)

**Effort:** 2 days (testing rolling updates, scaling, etc.)

---

### 1.6 Render PostgreSQL and schema migration

**Task:** Connect to Render DB from k3s and run schema migrations.

---

### 1.2 Authentication scaffold

**Task:** OTP-based signup and login flow.

**Features:**
- `POST /api/auth/otp/send` - Generate OTP, send via SMS/OTP provider, hash OTP in DB.
- `POST /api/auth/otp/verify` - Verify OTP, create account + session, rate-limit to 3 attempts per 15 min.
- `GET /api/auth/me` - Current user info (from session).
- `POST /api/auth/logout` - Clear session.

**Database:**
- `accounts` table.
- `otp_logs` table (hash OTP, no plaintext).
- Session storage (Cloudflare KV or D1).

**UI:**
- `/login` page with mobile input, "Send OTP" button, OTP entry field, "Verify" button.
- `/account` dashboard (stub; full build in Phase 2).

**Acceptance criteria:**
- [ ] OTP sent within 2 minutes; valid for 10 minutes.
- [ ] OTP hashed (SHA-256), never stored plaintext.
- [ ] Rate-limit: 3 requests per 15 min per IP → 429.
- [ ] No mobile number in logs, errors, or URLs.
- [ ] Session cookie secure, HttpOnly, SameSite=Strict.
- [ ] Tests: happy path, expired OTP, wrong OTP, rate limit.

**Effort:** 2 days

---

### 1.3 Court seeding

**Task:** Admin endpoint to upload and import court CSV.

**Format:**
```
id, name, local_name, kind, state, district_code, city, locality, address, pincode, latitude, longitude
KL-HC-001, High Court of Kerala, കേരളത്തിന്റെ ഉച്ചയോടോ കോടതി, High Court, Kerala, KL, Kochi, Kochi, ..., 682001, 9.9312, 76.2673
```

**Endpoint:**
- `POST /api/admin/courts/import` - Upload CSV, validate, insert/update courts.
- `GET /api/admin/courts` - List courts (paginated).
- `PUT /api/admin/courts/{id}` - Edit court details (key-value table).

**Acceptance criteria:**
- [ ] CSV upload success → 200 with row count.
- [ ] Validation: required columns, lat/lng numeric, no duplicates by name.
- [ ] Court details editable in back office (courts.php or admin dashboard).
- [ ] Seeded courts visible in `/manage/{pageId}` court selector.
- [ ] Localities auto-created if missing.

**Effort:** 1.5 days

---

### 1.4 Page creation and live editor

**Task:** Minimum viable page creation and editing.

**Minimum fields for advocate page:**
- Name (required)
- Slug (required; validated a-z/digits/hyphen; check uniqueness)
- Enrolment number (required; shown "as declared")
- District (required; dropdown)

**Minimum fields for firm page:**
- Name (required)
- Slug (required)
- District (required)

**UI:**
- `/manage/new` - Select page type (advocate/firm), enter minimum fields.
- `/manage/{pageId}` - Live editor with tabs:
  - Profile (name, slug, photo, banner, bio, about)
  - Courts and categories
  - Career timeline
  - Case summaries
  - Offices
  - Posts (stub)
  - Links
  - Domain (premium only; stub)
  - Plan (stub; admin-assigned)

**Editor constraints:**
- Photo: max 5MB, convert to 3 sizes (WebP), upload to R2 in background.
- Banner: max 10MB, 3 sizes, R2.
- All fields: real-time banned-word check (see `/rules/bar-council-wording.md`).
- Slug: change once per 90 days; old slug redirects 12 months.

**Acceptance criteria:**
- [ ] Page created with minimum fields; max 3 pages per account.
- [ ] Slug unique globally; a-z, digits, hyphen only.
- [ ] Photo/banner uploaded async; UI shows progress.
- [ ] All text fields flagged for banned words (live, before save).
- [ ] Edit and save persist to DB.
- [ ] Page published when status = 'active'.

**Effort:** 4 days

---

### 1.5 Advocate and firm profile pages

**Task:** Public-facing profile pages for advocates and firms.

**Advocate page (`/{slug}`):**
- Header: photo, name, enrolment, district, year enrolled
- Badges: completeness score (owner only)
- About section: bio (500), About (5000)
- Courts and categories (read-only list)
- Career timeline (read-only)
- Case summaries (read-only)
- Offices (link to office pages)
- "Member of" firms (if applicable)
- Posts (recent 3)
- Connect button (sticky on mobile; WhatsApp + call)
- Compare checkbox
- Nearby/similar advocates (Basic plan only; Premium hides these)

**Firm page (`/{slug}`):**
- Header: banner, name, year established, district
- About section: bio, About
- Courts and categories
- Offices (main + branches)
- Lawyers section (with title, office, intro, photo)
- Posts (recent 3)
- "Member firms" toggle (Professional+ only)
- Connect button
- Compare checkbox

**JSON-LD schema:** Attorney (advocate), LegalService (firm), BreadcrumbList, OpenGraph tags.

**Canonical URL:** Depends on premium status.

**Acceptance criteria:**
- [ ] Page renders with all fields present.
- [ ] Connect button opens WhatsApp with: "Hello, I found your page {url}. I would like to speak with you."
- [ ] Photos load from R2; responsive on mobile.
- [ ] No banned wording visible.
- [ ] Schema validates (https://validator.schema.org/).
- [ ] Compare checkbox toggles page into `/compare` query.

**Effort:** 3 days

---

## 2. Phase 1: Search and discovery 

### 2.1 Search page and filters

**Task:** Build the main search landing page with district-based filtering.

**Routes:**
- `GET /search?d={districtCode}` - Search results for a district
- `GET /search?d={districtCode}&cat={categoryCode}` - District + practice area
- `GET /search?d={districtCode}&court={courtId}` - District + court
- `GET /search?d={districtCode}&location={locationCode}` - District + location
- Query params for sort, pagination, etc.

**UI:**
- Header: district selector (dropdown or autocomplete)
- Filters (optional):
  - Practice area (checkbox/dropdown)
  - Court (checkbox/dropdown)
  - Location (checkbox/dropdown)
  - Language (if /ml/ route)
  - Experience (slider or steps)
  - Sort (Relevance, Nearest, Most experienced, Newest)
- Results: advocate/firm cards, paginated, 10 per page

**Ranking:** See `/rules/seo.md` section 10 for the scoring model.

**SEO:**
- Readable paths: `/d/{code}`, `/d/{code}/practice-area/{catcode}`, etc.
- Noindex for query-param versions (`?sort=`, `?page=2`, `?first=`).
- Canonical to the clean path.

**Acceptance criteria:**
- [ ] Search results returned; ranked by relevance/nearness/quality.
- [ ] Filters working; results update when filter changes.
- [ ] Pagination: "Next/Prev" or infinite scroll.
- [ ] Readable paths (`/d/{code}`) indexed; param-based paths noindex with canonical.
- [ ] No "top" or "best" labels; only "Sorted by relevance".
- [ ] Maps integration (optional MVP 1; nice-to-have).

**Effort:** 3 days

---

### 2.2 Court pages

**Task:** Court pages as traffic drivers and advocate-signup magnets.

**Route:** `GET /c/{id}/{seo}`

**Page structure:**
- Hero: court name, location, call-to-action banner "Join AdvocateID"
- Tabs:
  - Overview: court address, key details (from `court_details`), map
  - Advocates: filtered list of advocates in this court (search results)
  - Newly joined: recent pages that added this court (max 10)
  - Updates and posts: court updates + contributed posts (most recent)
- CTA at bottom: "Add this court to your page"

**Court updates (`/u/{id}/{seo}`):**
- Article page with court name, body, source link, contribution credit
- JSON-LD Article schema

**Acceptance criteria:**
- [ ] Court page loads with tabs.
- [ ] Advocates filtered by court; sorted by relevance.
- [ ] "Newly joined" shows recent advocates.
- [ ] Court updates render as articles.
- [ ] CTA "Add this court to your page" works (authenticated users only).
- [ ] Map renders (using Mapbox or similar).

**Effort:** 3 days

---

### 2.3 Location pages

**Task:** Location-based discovery.

**Routes:**
- `GET /l/{id}/{seo}` - Location (district or city)
- `GET /l/{id}/{seo}/{catcode}` - Location + practice area

**Page structure:**
- Hero: location name, local-language name
- Advocates/firms in that location (search results)
- Filter by practice area

**Acceptance criteria:**
- [ ] Location pages render with advocates.
- [ ] SEO: indexed, canonical correct.
- [ ] Local names (Malayalam) show on `/ml/l/{id}/{seo}`.

**Effort:** 1.5 days

---

## 3. Phase 2: Posts and updates 

### 3.1 Posts (articles by advocates)

**Task:** Allow advocates to publish posts.

**Routes:**
- `POST /api/posts` - Create post (authenticated)
- `GET /post/{id}/{seo}` - View post
- `PUT /api/posts/{id}` - Edit post (owner)
- `DELETE /api/posts/{id}` - Delete post (owner; soft-delete)

**Post fields:**
- Title (required)
- Body (10,000 chars max)
- Cover image (optional)
- Categories (up to 3)
- Court tag (optional)
- Source URL (optional)
- Language (en or ml)

**UI:**
- `/manage/{pageId}/posts` - List and add posts
- Post editor: WYSIWYG with live banned-word check

**Post page:**
- Global post: `/post/{id}/{seo}` - show post, author card, similar posts
- Custom domain: `/p/{id}/{seo}` (premium only)

**Acceptance criteria:**
- [ ] Posts created with title, body, categories.
- [ ] Banned-word check on publish.
- [ ] Global post page indexed; canonical to domain (Premium).
- [ ] Author card shows page name, photo, link to profile.
- [ ] Similar posts (same category, different author) shown below.

**Effort:** 2.5 days

---

### 3.2 Court updates (contributed posts)

**Task:** Advocates contribute court updates.

**Routes:**
- `GET /c/{id}/{seo}/updates` - List updates for a court
- `POST /api/court-updates` - Create update (authenticated)
- `PUT /api/court-updates/{id}` - Edit (owner)

**Fields:**
- Title (required)
- Body (5,000 chars)
- Court (required; from dropdown)
- Source URL (required)

**Published with credit:** "Update contributed by [page name]"

**UI:**
- Form on court page: "Contribute an update"
- `/manage/{pageId}/updates` - List owner's contributions

**Acceptance criteria:**
- [ ] Update created and published immediately.
- [ ] Credited to author.
- [ ] Banned-word check.
- [ ] Anyone can report an update; admin can suspend.

**Effort:** 1.5 days

---

## 4. Phase 3: Premium and custom domains 

### 4.1 Custom domain setup

**Task:** Cloudflare for SaaS integration; CNAME routing.

**Admin flow:**
- Owner enters custom domain in `/manage/{pageId}/domain`
- System creates a CNAME target: `{slug}.p.advocateid.in`
- Owner points their domain via CNAME to `{slug}.p.advocateid.in`
- DNS verified; SSL cert issued (Cloudflare handles)
- Page now serves from custom domain

**Routing:**
- Custom domain root (`https://example.com/`) → serve `/{slug}` content
- Custom domain `/p/{id}/{seo}` → serve post content
- Custom domain `/offices`, `/o/{id}`, `/lawyers` → serve with domain styling
- No links to advocateid.in (except tiny legal footer)

**SEO:**
- Custom domain indexed; canonical = custom domain
- `advocateid.in/{slug}` stays available internally but is noindex
- If domain lapses, advocateid.in/{slug} becomes indexable again

**Acceptance criteria:**
- [ ] CNAME target generated.
- [ ] Custom domain verified and SSL enabled.
- [ ] Custom domain serves content correctly.
- [ ] Advocateid.in version noindex, canonical to custom domain.
- [ ] Domain lapse gracefully falls back to advocateid.in.

**Effort:** 2.5 days (Cloudflare SaaS setup + routing logic)

---

### 4.2 Premium page layout

**Task:** Premium pages styled as standalone websites.

**Features (Premium only):**
- Custom colors (brand color picker)
- No platform header (full-width)
- Masthead, stat strip, tabs
- Unlimited lawyers (firm)
- All features in the plan matrix

**UI:**
- `/manage/{pageId}` → Brand tab with color picker
- Premium pages render differently based on custom domain status

**Acceptance criteria:**
- [ ] Custom color applied to links, buttons, accents.
- [ ] Masthead and stat strip render.
- [ ] No platform branding visible (except legal footer).

**Effort:** 1.5 days

---

## 5. Phase 4: Final push 

### 5.1 Sitemap and SEO finalization

**Task:** Generate sitemaps, robots.txt, JSON-LD validation.

**Sitemaps:**
- `/sitemap.xml` - index of all sitemaps
- `/sitemaps/static-1.xml` - home, info pages
- `/sitemaps/courts-1.xml` - court pages
- `/sitemaps/profiles-1.xml` - advocate/firm pages
- `/sitemaps/posts-1.xml` - post pages
- Per-domain sitemaps for custom domains

**Robots.txt:**
- Allow indexing of profiles, courts, posts
- Disallow /api, /admin, /account, /manage, /search (with params)

**JSON-LD schemas:**
- Attorney, LegalService, Article, GovernmentOrganization, BreadcrumbList
- Validate with schema.org validator

**Acceptance criteria:**
- [ ] Sitemaps generated nightly; no errors.
- [ ] Google Search Console accepts sitemaps.
- [ ] Robots.txt correct.
- [ ] JSON-LD valid on all pages.
- [ ] Core Web Vitals: LCP < 2.5s, FID < 100ms, CLS < 0.1.

**Effort:** 1 day

---

### 5.2 Analytics and event tracking

**Task:** Implement event recording for impressions, views, connects.

**Events:**
- Impression: page appears in list/search
- View: page opened
- Connect tap: button clicked

**Per-host:** advocateid.in vs custom domain

**Raw data:** Every load recorded with flags (is_owner, is_bot)
**Aggregates:** Nightly rollup (cleaned counts) for ranking and admin

**Acceptance criteria:**
- [ ] Events recorded in `page_events_raw` with visitor ID (rotating daily).
- [ ] Nightly aggregation job runs and populates `page_daily_events`.
- [ ] Raw data purged after 30 days; aggregates kept 1 year.
- [ ] Admin dashboard shows total impressions/views/connects.
- [ ] No personal data in logs or analytics.

**Effort:** 1.5 days

---

### 5.3 DPDP compliance review

**Task:** Final compliance audit before launch.

**Checklist (from `/rules/dpdp-checklist.md`):**
- [ ] Privacy notice shown before mobile collection.
- [ ] Consent checkbox present (account creation).
- [ ] OTP hashed, not stored plaintext.
- [ ] OTP logs purged after 7 days.
- [ ] Account soft-deleted after 30 days (grace period).
- [ ] No mobile numbers in logs, URLs, or error messages.
- [ ] Rotating visitor ID for analytics (not PII).
- [ ] Audit log for admin actions.
- [ ] Grievance form functional at `/grievance`.
- [ ] Data download functional at `/account/download`.
- [ ] Processor list finalized (Cloudflare, SMS provider, R2).

**Counsel sign-off required (T6).**

**Effort:** 2 days + counsel review

---

### 5.4 Bar Council compliance review

**Task:** Wording and field audit against Rule 36.

**Checklist:**
- [ ] Banned words removed from seed data (names, bios).
- [ ] Live editor flags banned words on input.
- [ ] Case summaries are factual (court, year, outcome; no client names).
- [ ] No star ratings, reviews, or testimonials visible.
- [ ] No fee or price information displayed.
- [ ] Highlights locked to format (number + label; no free text).
- [ ] All user-facing text reviewed for promotional tone.

**Counsel sign-off required (T2).**

**Effort:** 1 day + counsel review

---

### 5.5 Launch prep

**Task:** Final testing, deployment, monitoring.

**Staging:**
- Merge `feat/*` branches → staging.
- Run full test suite: unit, integration, E2E.
- Load test: 100 concurrent users, 1000 requests/min.
- Security scan: OWASP Top 10, no SQL injection, XSS.
- Manual testing: signup, create page, search, post, custom domain.

**Production:**
- Tag release version (e.g., `v1.0.0`).
- Merge staging → main.
- wrangler deploys to production.
- Verify uptime and logs.
- Alert team to monitor for errors.

**Monitoring:**
- Sentry for errors.
- Cloudflare analytics for traffic.
- Custom admin dashboard for events.
- Daily check of gravances and reports.

**Acceptance criteria:**
- [ ] All tests pass.
- [ ] No critical security issues.
- [ ] Load test passes (no timeouts).
- [ ] Production deployment successful.
- [ ] Monitoring alerts configured.

**Effort:** 2 days

---

## 6. Total effort estimation (updated for k3s + Helm + ArgoCD)

| Phase | Focus | Duration | Effort | Infrastructure lead |
|-------|-------|----------|--------|---|
| **Phase 0** | VPS+k3s, Helm, Docker, PostgreSQL, DNS, schema, auth, courts, pages | 2.5 weeks | 16 days | DevOps + Lead dev |
| **Phase 1** | Search, courts, locations | 2 weeks | 7.5 days | Lead dev |
| **Phase 2** | Posts, updates | 1 week | 4 days | Lead dev |
| **Phase 3** | Custom domains, premium (CNAME routing) | 1 week | 4 days | Lead dev + DevOps |
| **Phase 4** | SEO, analytics, compliance, launch | 1 week | 8 days | Lead dev + QA |
| **Total** | MVP 1 | **~7.5 weeks** | **39.5 days** | — |

**Key differences from Cloudflare stack:**
- **+5 days** for k3s cluster setup, Helm charts, ArgoCD configuration
- **+1 day** for Docker image and CI/CD GitHub Actions
- **+0.5 days** for cert-manager + Let's Encrypt automation
- **-0.5 days** for custom domain setup (CNAME handling is simpler with k3s Ingress)

**Assumptions:**
- 1 full-time developer (Claude Code or human)
- 1 DevOps engineer (for weeks 1–2 and week 6)
- Parallel work with design (Claude Design provides mockups by end of Phase 1)
- Counsel review runs in parallel (T2, T6 by end of Phase 4)
- VPS provisioning takes 24–48 hours (already waiting at start)

---

## 7. Definition of done (MVP 1 launch criteria)

**For MVP 1 to launch, ALL of these must be true:**

### Product
- [ ] Signup/login works (OTP).
- [ ] Create advocate and firm pages (minimum fields).
- [ ] Edit page with live editor; all tabs functional.
- [ ] Search by district, practice area, court, location.
- [ ] Court pages with tabs (Overview, Advocates, Updates).
- [ ] Posts and court updates create, edit, delete.
- [ ] Custom domain setup and served correctly.
- [ ] Compare up to 3 pages.
- [ ] Profile pictures and banner images upload and display.
- [ ] Sticky Connect button (mobile and desktop).

### SEO and performance
- [ ] Sitemaps generated; Google Search Console accepts.
- [ ] JSON-LD valid on all page types.
- [ ] Robots.txt correct (disallow /search, /api, /account, /admin).
- [ ] Canonical URLs correct (Premium domain precedence).
- [ ] Hreflang links on /ml/ pages.
- [ ] Core Web Vitals pass (LCP < 2.5s, CLS < 0.1).
- [ ] Lighthouse SEO score > 90.

### Compliance
- [ ] DPDP: privacy notice, consent, OTP hashing, audit log, grievance form. Counsel sign-off (T6).
- [ ] Bar Council: banned-word check, no ratings/testimonials, factual case summaries. Counsel sign-off (T2).
- [ ] IT Rules 2021: grievance officer contact, takedown process, terms.

### Analytics and monitoring
- [ ] Event recording (impression, view, connect) per host.
- [ ] Rotating visitor ID; no PII in analytics.
- [ ] Nightly aggregation job running.
- [ ] Admin dashboard shows total impressions/views/connects.
- [ ] Sentry alerts configured; no unhandled errors.

### Tests and quality
- [ ] Unit tests: 80%+ coverage.
- [ ] Integration tests: signup, create page, search, custom domain.
- [ ] E2E tests: key user flows (Cypress or Playwright).
- [ ] Linting: 0 errors, 0 warnings (ESLint).
- [ ] Build: `npm run build` succeeds.
- [ ] No console errors or warnings in production.

### Documentation
- [ ] AGENTS.md, MVP1-INSTRUCTIONS.md, PROJECT_REQUIREMENTS_v6.md in repo.
- [ ] /rules/ folder with all compliance docs.
- [ ] README with setup, deployment, monitoring.
- [ ] API documentation (routes, request/response, examples).
- [ ] Database schema documented.

### Security
- [ ] No hardcoded secrets; all in Cloudflare secrets.
- [ ] HTTPS only; HSTS header.
- [ ] CSRF tokens on all POST/PUT/DELETE.
- [ ] Rate limiting on OTP, reports, contact forms.
- [ ] Input validation (slugs, phone numbers, URLs).
- [ ] No SQL injection, XSS, CSRF vulnerabilities (security scan passed).

### Launch readiness
- [ ] Staging deployment stable (48 hours of uptime).
- [ ] Production monitoring active (Sentry, Cloudflare, admin dashboard).
- [ ] Rollback plan documented.
- [ ] Founder approval obtained.
- [ ] Legal review completed (counsel sign-off).

---

## 8. Post-launch (MVP 2 planning)

**Day 1 after launch:**
- Monitor errors and uptime.
- Review user feedback and grievances.
- Fix critical bugs (P0, P1).

**Week 1–2:**
- Gather metrics: signups, pages created, search usage.
- Identify top issues from logs and user reports.
- Plan MVP 2 features: payments, owner dashboard, jobs, reviews.

**MVP 2 kicks off after MVP 1 is stable.**

---

## 9. Questions for the founder

1. **Court CSV:** Can you provide the all-India court list (T3 task)?
2. **SMS/OTP provider:** Which provider? Twilio, MSG91, or other?
3. **Design approval:** When will Claude Design mockups be finalized?
4. **Counsel review:** Timeline for T2 (Bar Council field review) and T6 (DPDP)?
5. **Custom domain testing:** Should we test premium domain routing before full launch?
6. **Analytics tools:** Confirm preference: Cloudflare + own counters (recommended) or also GA4 in MVP 1?
7. **Go-live date:** Target date for launch? (Affects prioritization.)

---

## 10. Repository setup (T5)

**Before Phase 0 starts, you need:**

1. **Git repo structure** (GitHub or GitLab)
   - Branches: `main` (production), `staging` (preview)
   - Branch protection: no push to main; merge via PR only
   - PR template with compliance checklist
   - Directory structure:
     ```
     /src/app/          — Next.js application (src/app/*, src/db/, src/api/)
     /src/helm-charts/
       infra/           — Infrastructure Helm chart (NGINX, cert-manager, ArgoCD)
       app/             — Application Helm chart (Next.js deployment)
     /docker/
       Dockerfile       — Container image definition
     /.github/workflows/
       deploy.yml       — GitHub Actions CI/CD (build image, update Helm)
     ```

2. **Docker image and registry**
   - Docker Hub account created (free tier fine for MVP 1)
   - Credentials stored as GitHub Secrets: `DOCKER_USERNAME`, `DOCKER_PASSWORD`
   - Dockerfile at repo root
   - GitHub Actions workflow configured to build and push images

3. **Helm charts** (version controlled in Git)
   - `/src/helm-charts/infra/` — One-time infrastructure setup
     - NGINX Ingress Controller values
     - cert-manager ClusterIssuer for Let's Encrypt
     - ArgoCD installation (optional; can be installed manually)
   - `/src/helm-charts/app/` — Application deployment
     - Next.js Deployment, Service, Ingress
     - ConfigMaps (env vars), Secrets (DB credentials)
     - HorizontalPodAutoscaler (auto-scaling)
     - Values.yaml with image tag (auto-updated by GitHub Actions)

4. **PostgreSQL database** (Render or external)
   - Database created (free tier sufficient for MVP 1)
   - Connection string: `postgresql://user:pass@host:5432/db`
   - Stored as Kubernetes Secret (not in Git)

5. **Firebase Storage** (for images)
   - Firebase account created
   - Project set up
   - Storage bucket configured with CORS
   - Service account key (JSON) stored securely (not in Git; set as Kubernetes Secret)

6. **VPS and k3s cluster**
   - VPS provisioned (CloudPE ₹930/month or Hetzner)
   - k3s installed via one-liner
   - Helm installed on local laptop: `curl https://raw.githubusercontent.com/helm/helm/main/scripts/get-helm-3 | bash`
   - kubeconfig downloaded and configured for remote access

7. **DNS configuration**
   - Domain pointed to VPS IP (A record)
   - Wildcard CNAME configured: `*.advocateid.in` → `advocateid.in`
   - Nameservers pointed to Cloudflare or registrar (for DNS management)

8. **Secrets management**
   - Database URL stored in Kubernetes Secret: `kubectl create secret generic db-credentials --from-literal=url=$DATABASE_URL`
   - Firebase service account key stored similarly
   - OTP provider API key stored in Kubernetes Secret
   - All secrets use `--from-literal` or `--from-file`; never in Git

9. **GitHub Actions secrets**
   - `DOCKER_USERNAME` — Docker Hub username
   - `DOCKER_PASSWORD` — Docker Hub authentication token
   - Any other CI/CD credentials

10. **Certificates (automatic via cert-manager)**
    - No manual setup needed; cert-manager handles Let's Encrypt
    - ClusterIssuer created in Helm infra chart points to Let's Encrypt production
    - HTTPS enabled automatically for all Ingress rules

**Setup time:** ~2–3 days (T5 task for DevOps)
- Day 1: VPS provisioning, k3s install, Helm setup
- Day 2: GitHub Actions, Docker registry, Helm charts structure
- Day 3: PostgreSQL, Firebase, DNS, secrets, testing
