# HealthPassport Pro

> A production-grade Progressive Web App for **personal health records** and
> **interactive chronic-disease care**.

HealthPassport Pro lets patients own and manage their personal health record,
track chronic conditions (starting with **diabetes** and **hypertension**),
receive **safe, evidence-based educational guidance**, prepare
**physician-ready reports**, and — in later phases — engage with structured
chronic-care pathways, a physician dashboard, and clinical decision support.

> ⚕️ **Safety scope.** HealthPassport Pro is a *personal health record and
> education tool*, not a diagnostic device and not a substitute for
> professional medical care. It never diagnoses, never prescribes, and it
> escalates red-flag inputs to "seek care now." See
> [`docs/CLINICAL_SAFETY.md`](docs/CLINICAL_SAFETY.md).

---

## Why this exists

Patients live with chronic disease every day but see their care team a few times
a year. The record of what happens *between* visits — home readings, symptoms,
medication adherence, questions — is fragmented across paper, memory, and a
dozen apps that don't talk to each other. HealthPassport Pro is the patient's
durable, portable, interoperable health record: **offline-first**, **encrypted
on-device**, **FHIR-aligned** so it can exchange with the wider health system,
and **clinically safe** by construction.

## Product principles

1. **The patient owns the data.** Local-first, encrypted at rest, exportable and
   portable at any time. No lock-in.
2. **Safe by construction.** Every educational and analytic surface passes
   through a clinical-safety layer. The app escalates, it never diagnoses.
3. **Interoperable from day one.** The internal model is FHIR R4-aligned so that
   EHR/FHIR exchange in later phases is a mapping exercise, not a rewrite.
4. **Works everywhere, offline.** A PWA that installs on any device and remains
   fully usable with no connection.
5. **Built to scale.** Architecture targets 1,000,000 patients and, in a later
   phase, 100,000 physicians — see [`docs/ARCHITECTURE.md`](docs/ARCHITECTURE.md).

## Repository layout

This is an npm-workspaces monorepo. Phase 1 ships the patient PWA; the layout
reserves clear seams for the services that later phases add.

```
healthpassport/
├── apps/
│   └── web/                 # Patient PWA (React + TypeScript + Vite)  ← this phase
│       └── src/
│           ├── domain/      # FHIR-aligned models, value sets, validation
│           ├── safety/      # Clinical-safety engine (guardrails, red flags)
│           ├── infrastructure/  # Encrypted IndexedDB store, crypto, audit log
│           ├── features/    # PHR, chronic-care, reports, education (vertical slices)
│           ├── i18n/        # Localization + RTL
│           └── ui/          # Design system primitives
├── packages/                # (reserved) shared libs extracted from apps/web
│                            #   e.g. @healthpassport/fhir, @healthpassport/safety
├── docs/                    # Architecture, security, clinical safety, interop, ADRs
└── package.json             # Workspace root
```

> **Roadmap seams (not built yet, designed for):** `apps/api` (FHIR-facing
> backend), `apps/physician` (clinician dashboard), `apps/admin`. Their designs
> live in [`docs/ARCHITECTURE.md`](docs/ARCHITECTURE.md) and
> [`docs/ROADMAP.md`](docs/ROADMAP.md).

## Getting started

```bash
cd healthpassport
npm install
npm run dev          # start the patient PWA (Vite dev server)
npm run typecheck    # tsc --noEmit
npm test             # Vitest unit tests (domain, safety, infrastructure)
npm run build        # production build (installable PWA)
npm run preview      # serve the production build locally
```

## Documentation

| Doc | What it covers |
|-----|----------------|
| [`docs/ARCHITECTURE.md`](docs/ARCHITECTURE.md) | System architecture, scaling to 1M patients, phase plan, component design |
| [`docs/SECURITY.md`](docs/SECURITY.md) | Threat model, encryption, consent, PHI handling, incident response |
| [`docs/CLINICAL_SAFETY.md`](docs/CLINICAL_SAFETY.md) | Safety classification, red-flag escalation, content-review process, disclaimers |
| [`docs/INTEROPERABILITY.md`](docs/INTEROPERABILITY.md) | FHIR R4 mapping, value sets, export/import, EHR integration plan |
| [`docs/ROADMAP.md`](docs/ROADMAP.md) | Phased delivery from MVP to physician platform + DSS |
| [`docs/adr/`](docs/adr/) | Architecture Decision Records |

## Status

**Phase 1 (patient PWA MVP) — complete and launchable.** A patient can install
the app, set a passphrase, keep an encrypted health record offline, track
diabetes and blood pressure against targets, receive red-flag escalation and
safe education, and export a physician-ready report + FHIR Bundle — all on-device.

- **45 tests** cover crypto, the encrypted store + audit chain, the safety
  engine, chronic-care analytics, FHIR export, and the onboarding flow.
- `typecheck`, `lint`, `test`, and `build` are green; **0 npm audit
  vulnerabilities**; CI runs all of the above.
- The critical path (onboarding → persist → lock → decrypt) is verified in a real
  browser.

See [`CHANGELOG.md`](CHANGELOG.md) for the full Phase-1 feature list and
[`docs/ROADMAP.md`](docs/ROADMAP.md) for what comes next (backend/sync, physician
platform, DSS). Every major phase landed as a discrete, reviewable commit — this
is a real product foundation, not a demo.
