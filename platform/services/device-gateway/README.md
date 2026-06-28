# `services/device-gateway` — Medical Device Ingest (skeleton)

## Implemented in this skeleton

- `src/core/mapping.ts` — `toObservation` maps a `RawMeasurement` → FHIR `Observation`
  with shared `LOINC` codes, units normalisation (mmol/L→mg/dL, lb→kg), and a stable
  `measurementIdentifier` for the dedup/idempotency contract.
- `src/core/queue.ts` — `OfflineQueue`: idempotent enqueue, FIFO `due()`/`ack()`/`fail()`
  with exponential backoff — the durable offline-sync contract (Vol 4/5).
- `src/server.ts` — runnable Fastify entry (`/health`, `/v1/ingest`).

The core typechecks clean (strict TS). Health Connect / BLE / vendor-cloud connectors and
the backend-forwarding worker are `TODO(Vol 5)` and built in Phase 2. Run: `npm install && npm run dev`.


Ingests measurements from medical devices and normalises them into FHIR `Observation`s.
**Spec:** [Volume 5 — Medical Device Integration](../../../docs/specification/05-medical-devices.md) · sync [Volume 4](../../../docs/specification/04-backend.md).

> Some ingest runs **on-device** in the mobile app (Health Connect / BLE); this service
> is the server-side counterpart for vendor-cloud pulls (e.g. Dexcom, LibreView),
> dedup, units normalisation, and forwarding to `services/backend`. Read-only ingest —
> the platform never controls therapy devices (pumps/pens) in early phases.

## Channels & mappings (Vol 5)

- **Android Health Connect** (primary), **direct BLE** (GATT services + RACP history),
  **vendor cloud APIs** (where BLE is restricted).
- CGM / BGM / BP / scale / pulse-oximeter → platform markers → FHIR `Observation`
  with `LOINC` codes from `@diabetes-quest/shared`.

## First tasks (Vol 10 Phase 2)

1. Health Connect read pipeline + permissions (in the mobile app) feeding this service.
2. Vendor-cloud connectors (OAuth, polling/webhooks), dedup + units normalisation.
3. The durable offline queue + idempotency keys + conflict resolution (matches Vol 4).
4. FHIR `Device` registration + firmware capture; new-device certification checklist.

**DoD:** every `FR-DEV-` has tests incl. timezone/units edge cases (Vol 9); no therapy control.
