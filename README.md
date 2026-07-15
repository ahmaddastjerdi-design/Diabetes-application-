# HealthPassport Pro

> A production-grade, full-stack **Progressive Web App** for personal health
> records and interactive chronic-disease care.

HealthPassport Pro helps patients track chronic diseases, store medical records,
understand their trends, receive safe educational guidance, recognize red-flag
symptoms, and generate physician-ready reports — built with the seriousness of a
real medical product.

> **Global safety disclaimer.** HealthPassport Pro is a personal health record and
> educational chronic care guide. It does not diagnose, prescribe, or replace your
> physician. For urgent symptoms such as chest pain, severe shortness of breath,
> fainting, stroke-like symptoms, or severe weakness, seek emergency medical care.

---

## Run the complete app in one command

With Docker installed, from this directory:

```bash
docker compose up --build
```

This builds the app, starts PostgreSQL, applies migrations, and seeds a
**synthetic demo patient**. Then open **http://localhost:3000** and sign in:

- **Email:** `demo@healthpassport.local`
- **Password:** `Demo!12345`

The demo dashboard already shows a red-flag blood-pressure reading, trends,
conditions, medications, and labs. Set `SEED_DEMO=false` in
[`docker-compose.yml`](docker-compose.yml) for an empty database. Stop with
`Ctrl-C`; wipe data with `docker compose down -v`.

> **New to this / on Windows?** Follow the step-by-step, no-experience-needed
> guide: **[`docs/LOCAL_SETUP_WINDOWS.md`](docs/LOCAL_SETUP_WINDOWS.md)**. Open
> **`http://localhost:3000`** (use `http://`, not `https://`). If the page says
> "can't be reached", the app is usually still building — wait for the terminal
> to print **`✓ Ready`**, then refresh.

## Deploy to a public URL

A [`render.yaml`](../render.yaml) Blueprint is included. On
[render.com](https://render.com) → **New → Blueprint** → pick this repo: Render
provisions a PostgreSQL database and the web service, builds the Docker image,
runs migrations, seeds the demo patient, and returns a public `https` URL. Sign
in with the demo credentials above. (Full staging/production runbook:
[`docs/DEPLOYMENT.md`](docs/DEPLOYMENT.md).)

## Run locally without Docker

Requires Node 20 and a PostgreSQL database.

```bash
cp .env.example .env          # then fill in DATABASE_URL, DIRECT_URL, AUTH_SECRET
npm install
npm run db:migrate            # apply migrations
node prisma/demo-seed.mjs     # optional: seed the demo patient
npm run dev                   # http://localhost:3000
```

Generate a secret with `openssl rand -base64 32`.

## Scripts

| Command | What it does |
|---------|--------------|
| `npm run dev` | Start the dev server |
| `npm run build` / `npm run start` | Production build / serve |
| `npm run typecheck` · `npm run lint` | Types and linting |
| `npm test` | Unit tests (Vitest) |
| `npm run e2e` | End-to-end + accessibility (Playwright + axe) |
| `npm run db:migrate` / `db:deploy` | Prisma migrations (dev / prod) |

## What's included (V1 — patient)

Registration & login · onboarding · profile · conditions · medications ·
allergies · vitals · labs · symptoms · daily check-in · documents (secure
upload) · encounters · chronic-care guides · physician-ready report (print +
FHIR export) · settings · privacy & security (consent, data export, account
deletion) · installable PWA with an offline health summary.

**Chronic-care focus:** hypertension, type 2 diabetes, CKD risk, dyslipidemia /
cardiovascular risk, obesity / metabolic syndrome, medication adherence, and
preventive-care reminders.

## Technology

Next.js (App Router) · TypeScript (strict) · Tailwind CSS · React Hook Form ·
Zod · Recharts · Lucide · PostgreSQL · Prisma · Auth.js / NextAuth ·
S3-compatible object storage · PWA (manifest + service worker) · Vitest ·
Playwright + axe · ESLint · Prettier · GitHub Actions CI.

## Safety, security & accessibility

- **Clinical safety:** a cited red-flag engine (EMERGENCY / URGENT / ROUTINE)
  that never diagnoses, prescribes, or changes medication — it tracks, educates,
  shows trends, and tells you when to seek care. See
  [`docs/MEDICAL_SAFETY_RULES.md`](docs/MEDICAL_SAFETY_RULES.md).
- **Security:** ownership-scoped data access (no IDOR), server-side
  authorization, Zod validation, magic-byte file validation, audit logging,
  CSP + security headers, env validation at boot. See
  [`docs/SECURITY_CHECKLIST.md`](docs/SECURITY_CHECKLIST.md).
- **Accessibility:** WCAG 2.2 AA; status is never conveyed by colour alone. See
  [`docs/ACCESSIBILITY_CHECKLIST.md`](docs/ACCESSIBILITY_CHECKLIST.md).

## Documentation index

| Document | Purpose |
|----------|---------|
| [`docs/PRD.md`](docs/PRD.md) | Product requirements — users, modules, scope, safety |
| [`docs/ARCHITECTURE.md`](docs/ARCHITECTURE.md) | System architecture and folder structure |
| [`docs/DATABASE_SCHEMA.md`](docs/DATABASE_SCHEMA.md) | Prisma/PostgreSQL data model (18 tables) |
| [`docs/MEDICAL_SAFETY_RULES.md`](docs/MEDICAL_SAFETY_RULES.md) | Safety boundaries, red-flag rules, disclaimers |
| [`docs/CLINICAL_REFERENCE.md`](docs/CLINICAL_REFERENCE.md) | Cited clinical thresholds (ACC/AHA, ADA, KDIGO, WHO, NEWS2) |
| [`docs/SECURITY_CHECKLIST.md`](docs/SECURITY_CHECKLIST.md) | OWASP ASVS-inspired controls checklist |
| [`docs/PRIVACY_MODEL.md`](docs/PRIVACY_MODEL.md) | Consent, data rights, retention, minimization |
| [`docs/ACCESSIBILITY_CHECKLIST.md`](docs/ACCESSIBILITY_CHECKLIST.md) | WCAG 2.2 AA checklist |
| [`docs/SCALABILITY_PLAN.md`](docs/SCALABILITY_PLAN.md) | Scaling to 1M patients / 100k physicians |
| [`docs/FHIR_MAPPING.md`](docs/FHIR_MAPPING.md) | FHIR-inspired models + mapping functions |
| [`docs/QA_TEST_PLAN.md`](docs/QA_TEST_PLAN.md) | Test strategy, matrix, and CI gates |
| [`docs/DEPLOYMENT.md`](docs/DEPLOYMENT.md) | Staging/production deployment runbook |

## Roadmap

V1 serves **patients only**. Future: family-caregiver access, physician
dashboard, clinic admin, care coordinator, FHIR/EHR integration, and
decision-support — scaling toward 1,000,000 patients / 100,000 physicians.
