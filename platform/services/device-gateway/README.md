# `services/device-gateway` — Medical Device Ingest (stub)

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
