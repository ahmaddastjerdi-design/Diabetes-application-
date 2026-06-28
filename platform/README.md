# Diabetes Quest — Platform Monorepo

> The full **clinical-grade platform** scaffold described by the
> [specification suite](../docs/specification/README.md). This is a **separate, larger
> project** than the educational prototype at the repo root — it is the thing the
> ten spec volumes describe building.

⚕️ **Status: scaffold.** This directory establishes the project *structure*, workspace
wiring, and a substantive **shared contracts** package. The apps and services are
**documented stubs** — each has a README pointing to its spec volume and its first
build tasks (from [Volume 10](../docs/specification/10-claude-code-build-playbook.md)).
No business logic is fabricated here; it is built phase by phase per the playbook.

The existing root Expo app (`../App.tsx`, `../src/…`) is **Phase 0** and the seed for
[`apps/mobile`](./apps/mobile/README.md).

---

## Workspace layout

```
platform/
  package.json                 npm workspaces root
  packages/
    shared/                    ✅ real: domain + FHIR contracts (one source of truth)
  apps/
    mobile/                    stub → Vol 2 (Android PRD) · seeded by root prototype
    clinician-web/             stub → Vol 3 (Doctor Panel)
  services/
    backend/                   stub → Vol 4 (Backend, FHIR, sync, audit)
    ai-coach/                  stub → Vol 6 (AI Health Coach, guardrails)
    device-gateway/            stub → Vol 5 (Health Connect / BLE ingest)
```

## How this maps to the specs

| Package | Spec volume(s) | Build phase (Vol 10) |
|---------|----------------|----------------------|
| `packages/shared` | 4 (data model), 5 (FHIR codes), all (shared types) | Phase 0–1 |
| `apps/mobile` | 2 (Android PRD), 7 (design system) | Phase 0 (harden) → 2 |
| `apps/clinician-web` | 3 (Doctor Panel), 7 (design system) | Phase 3 |
| `services/backend` | 4 (Backend), 8 (security) | Phase 1 |
| `services/ai-coach` | 6 (AI System), 8 (AI security) | Phase 4 |
| `services/device-gateway` | 5 (Devices), 4 (sync) | Phase 2 |

## Why a monorepo

The platform spans a React Native app, a React web panel, and several Node/TypeScript
services that must agree on the same data model. A single workspace lets every package
import `@diabetes-quest/shared` so the marker/organ/FHIR contracts cannot drift —
exactly the consistency the spec's traceability depends on.

## Getting started

```bash
cd platform
npm install            # wires the workspaces
npm run -w @diabetes-quest/shared build
```

Then pick a phase from [Volume 10's build order](../docs/specification/10-claude-code-build-playbook.md#build-order)
and a package above. Each package README lists its Definition of Done and first tasks.
