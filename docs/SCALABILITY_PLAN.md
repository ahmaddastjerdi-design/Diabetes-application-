# HealthPassport Pro — Scalability Plan

Status: Phase 0 · Owner: Principal Architect

Target: eventually **1,000,000 patients** and **100,000 physicians**. V1 serves
patients only, but its data model and query patterns are chosen so growth is a
scaling exercise, not a rewrite.

---

## 1. Principles
- **Never load all records.** Every list is paginated (cursor-based) and
  index-backed.
- **Push work to the database and storage tiers**, not the app process.
- **Keep the interactive path cheap**; defer heavy work to background jobs.
- **Separate analytics from clinical data.**

## 2. Query & indexing strategy
- All clinical queries scope by `userId` and use composite indexes:
  - Time-series (`VitalObservation`, `LabResult`): `(userId, type, recordedAt)`.
  - Events (`SymptomEntry`, `Encounter`, `Document`): `(userId, recordedAt/createdAt)`.
  - `Condition`/`Medication`: `(userId, status)`.
  - `AuditLog`: `(userId, createdAt)` and `(action, createdAt)`.
- **Cursor pagination** (keyset on `(recordedAt, id)`) — stable and fast at depth;
  no `OFFSET` scans.
- Dashboard shows **recent windows** (e.g. last N or last 90 days), not full
  history; "load more" fetches the next page.

## 3. Documents & object storage
- Files live in **S3-compatible object storage**; the DB stores only metadata
  (`storageKey`, `mimeType`, `sizeBytes`, `checksumSha256`).
- Access via **short-lived signed URLs**; uploads via signed/pre-authorized flow
  to keep bytes off the app server.
- Storage lifecycle policies for cost tiers and deletion.

## 4. Connection & compute scaling
- **Connection pooling** (e.g. PgBouncer / serverless-friendly pooler) to survive
  many concurrent serverless functions.
- Next.js server scales **horizontally** (stateless); sessions in signed cookies,
  not server memory.
- Cache read-heavy, low-sensitivity data (guide content, reference ranges) at the
  edge/CDN; **never cache PHI** at shared layers.

## 5. High-volume observations (future)
- `VitalObservation` is the highest-growth table. Plan:
  - **Partition** by time (range) and/or hash on `userId` when volume warrants.
  - Roll up old detail into **downsampled aggregates** for long-range trends.
  - Optional time-series extension (e.g. Timescale) if needed.

## 6. Read replicas & regionalization (future)
- Route heavy reads (dashboards, reports) to **read replicas**.
- **Regional data residency**: partition tenants by region for GDPR/local law;
  keep PHI in-region.

## 7. Background jobs & queues (future)
- A queue (e.g. Redis/BullMQ or a managed queue) handles: reminder scheduling,
  report generation, document post-processing (checksum/scan/thumbnail),
  export bundling, and notification delivery — off the request path.

## 8. Physician scale (future, 100k physicians)
- Physician reads are **consent-scoped** and served from a **read model** (CQRS)
  separate from the transactional store, so patient-facing writes and
  panel/population queries don't contend.
- Tenant isolation per clinic; caching of panel views.

## 9. Analytics separation
- Product/usage metrics are **de-identified** and flow to a **separate** analytics
  store — never mixed with clinical tables, never containing PHI.

## 10. Observability (grows with scale)
- Structured, PHI-scrubbed logs; request tracing; DB slow-query monitoring; error
  tracking; capacity dashboards. Audit logging is separate from ops logging.

## 11. What V1 implements now vs. later
| Now (V1) | Later (as load grows) |
|----------|------------------------|
| Owner-scoped, indexed, paginated queries | Partitioning, read replicas |
| Object storage for documents | Downsampled aggregates, TS extension |
| Stateless app, cookie sessions | Queues/background jobs, CQRS read model |
| Analytics separated by design | Regional residency, physician read models |
