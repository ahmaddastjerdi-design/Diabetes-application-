# `@diabetes-quest/shared`

The **single source of truth** every platform package imports — domain and FHIR
contracts that must not drift between the mobile app, clinician web panel, backend,
device-gateway, and AI coach.

| Module | Contents | Spec |
|--------|----------|------|
| `domain/markers.ts` | `MarkerKey`, `OrganKey`, `MARKERS`, `ORGANS`, glucose unit conversion | Vol 4, mirrors `src/engine/physiology.ts` |
| `domain/fhir.ts` | `FhirResourceType`, `Observation`, `LOINC` codes, `Quantity`/`Reference` | Vol 4 §FHIR, Vol 5 device codes |

This is the **only** package in the scaffold with real code — everything else is a
documented stub. It exists first because the spec's traceability depends on a shared
contract (Vol 10, Phase 0–1).

```bash
npm install
npm run -w @diabetes-quest/shared build
```

**Definition of Done (this package):** strict-mode `tsc` clean; markers/organs stay
byte-for-byte aligned with the prototype engine (enforced by a Vol 9 unit test that
imports both and diffs them); no runtime dependencies.
