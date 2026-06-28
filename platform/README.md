# Diabetes Quest — Platform Monorepo

> The full **clinical-grade platform** scaffold described by the
> [specification suite](../docs/specification/README.md). This is a **separate, larger
> project** than the educational prototype at the repo root — it is the thing the
> ten spec volumes describe building.

⚕️ **Status: buildable skeleton.** This directory establishes the project *structure*,
workspace wiring, the **shared contracts** package, and a real, **typechecked domain
core** for each backend service plus a runnable server entrypoint. The frontends have
real config and an entry shell. What is deliberately *not* here: persistence, auth,
UI screens, and network wiring — those are built phase by phase per
[Volume 10](../docs/specification/10-claude-code-build-playbook.md). No clinical values
or business rules are fabricated beyond what the specs define.

**Verified:** `packages/shared` and all three service cores
(`services/backend`, `services/ai-coach`, `services/device-gateway`) typecheck clean
under strict-mode TypeScript 6.

The existing root Expo app (`../App.tsx`, `../src/…`) is **Phase 0** and the seed for
[`apps/mobile`](./apps/mobile/README.md).

---

## Workspace layout

```
platform/
  package.json                 npm workspaces root
  packages/
    shared/                    ✅ contracts: domain + FHIR (one source of truth)
    clinical/                  ✅ clinical engine: TIR/GMI/CV/AGP, decision support, risk → Vol 3
    security/                  ✅ redaction, classification, field-encryption, DSAR → Vol 8
  apps/
    mobile/                    → Vol 2 · seeded by root prototype (migrates Phase 0–2)
    clinician-web/             ⬡ React panel (roster, AGP, decision support) → Vol 3
  services/
    backend/                   ⬡ typed core + Fastify entry + schema.sql → Vol 4
    ai-coach/                  ⬡ guardrail core + Claude entry → Vol 6
    device-gateway/            ⬡ mapping + offline-queue core + entry → Vol 5
```

✅ = real, typechecked, no external runtime deps · ⬡ = real domain core typechecks
clean; server/UI layer is idiomatic code that runs after `npm install`.

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
