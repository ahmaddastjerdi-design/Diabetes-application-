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

## Status: Phase 0 — Documentation

This directory currently contains **documentation only**. No application code has
been written yet. Code begins in Phase 1 after review/approval of these documents.

The build proceeds **phase by phase** (see [`docs/ARCHITECTURE.md`](docs/ARCHITECTURE.md)
§ Delivery phases). Work pauses for approval at milestones.

## Technology (target)

Next.js (App Router) · TypeScript (strict) · Tailwind CSS · shadcn/ui ·
React Hook Form · Zod · Recharts · Lucide · PostgreSQL · Prisma · Auth.js /
NextAuth · S3-compatible object storage · PWA (manifest + service worker) ·
Vitest · Playwright · ESLint · Prettier.

## Documentation index

| Document | Purpose |
|----------|---------|
| [`docs/PRD.md`](docs/PRD.md) | Product requirements — users, modules, scope, safety |
| [`docs/ARCHITECTURE.md`](docs/ARCHITECTURE.md) | System architecture, folder structure, delivery phases |
| [`docs/DATABASE_SCHEMA.md`](docs/DATABASE_SCHEMA.md) | Prisma/PostgreSQL data model (18 tables) |
| [`docs/MEDICAL_SAFETY_RULES.md`](docs/MEDICAL_SAFETY_RULES.md) | Safety boundaries, red-flag rules engine, disclaimers |
| [`docs/SECURITY_CHECKLIST.md`](docs/SECURITY_CHECKLIST.md) | OWASP ASVS-inspired controls checklist |
| [`docs/PRIVACY_MODEL.md`](docs/PRIVACY_MODEL.md) | Consent, data rights, retention, minimization |
| [`docs/ACCESSIBILITY_CHECKLIST.md`](docs/ACCESSIBILITY_CHECKLIST.md) | WCAG 2.2 AA checklist |
| [`docs/SCALABILITY_PLAN.md`](docs/SCALABILITY_PLAN.md) | Scaling to 1M patients / 100k physicians |
| [`docs/FHIR_MAPPING.md`](docs/FHIR_MAPPING.md) | FHIR-inspired models + mapping functions |
| [`docs/QA_TEST_PLAN.md`](docs/QA_TEST_PLAN.md) | Test strategy, matrix, and CI gates |
| [`docs/DEPLOYMENT.md`](docs/DEPLOYMENT.md) | Staging/production deployment runbook |

## Scale target (future phases)

1,000,000 patients · 100,000 physicians · physician dashboard · family-caregiver
access · FHIR/EHR integration · AI/DSS integration. Version 1 serves **patients
only**.
