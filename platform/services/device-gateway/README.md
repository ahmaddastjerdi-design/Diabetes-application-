# `services/device-gateway` — Medical Device Ingest (Phase 2)

## Phase 2 — implemented (connectors + forwarding worker)

**Domain core** (`src/core/`, pure, strict TS, 9 unit tests):

- `mapping.ts` (Phase 0) — `RawMeasurement` → FHIR `Observation`, units normalisation
  (mmol/L→mg/dL, lb→kg), stable `measurementIdentifier`.
- `queue.ts` (Phase 0) — `OfflineQueue`: idempotent enqueue, `due()/ack()/fail()` with backoff.
- `connectors.ts` — normalise per-source payloads: `fromHealthConnect` (Android),
  `fromDexcomEgv` (vendor cloud), and `preferByOrigin` cross-origin dedup (data-origin priority).
- `worker.ts` — `drainOnce(queue, deliver, now)`: forward-to-backend drain loop over an
  injected `Deliver` port (ack on success, backoff on failure).
- `device.ts` — `toFhirDevice` (registration → FHIR `Device` + firmware) and the
  `CERTIFICATION_CHECKLIST` gate for enabling a new device model.

**Infra** (`src/infra/`, real, runs after `npm install`; CI-typechecked via `build:full`):

- `deliver.ts` — `httpDeliver`: the real `fetch`-based POST to the backend.
- `src/server.ts` — Fastify ingest endpoints (`/v1/ingest`, `/v1/ingest/health-connect`,
  `/v1/ingest/dexcom`) plus the background forwarding loop.

### Run

```bash
npm install
npm test -w @diabetes-quest/device-gateway              # 9 unit tests
npm run -w @diabetes-quest/device-gateway test:integration   # real-HTTP forward test
BACKEND_URL=http://localhost:8080 npm run dev -w @diabetes-quest/device-gateway
```

The forwarding path is verified end-to-end in CI: the worker drains the queue and POSTs
to a real `node:http` server (`test-integration/forward.integration.test.mjs`), mirroring
`httpDeliver`.

### Still TODO (later work)

On-device Health Connect / BLE reads live in `apps/mobile` (Phase 2 mobile task); the
real Dexcom OAuth poller/webhook, persistent (cross-restart) queue storage, and device
registration persistence are deferred.


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
