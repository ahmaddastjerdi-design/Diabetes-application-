# ADR-0002 — Offline-first, encrypted-at-rest local store

- Status: Accepted
- Date: 2026-07-09
- Deciders: Principal Architect, Security Engineer, Clinical Safety Officer

## Context

Phase 1 ships without a backend, yet handles PHI and must be fully usable
offline. We need durable local storage that (a) holds structured records and
grows to a full record, (b) protects PHI at rest, and (c) presents a persistence
seam the future backend can slot behind without rewriting features.

## Decision

- Persist through a **repository interface** in `domain/repository.ts`.
- Phase-1 implementation: **`EncryptedIndexedDbRepository`** — records are
  **AES-GCM** encrypted (Web Crypto) under a **PBKDF2**-derived key from the
  user's passphrase, then stored in **IndexedDB** (via `idb`).
- The derived key lives only in memory during an unlocked session; locking
  clears it. No plaintext PHI and no key material is ever written to disk.
- An append-only **audit log** records data-access events locally.

## Consequences

**Positive**
- PHI is ciphertext at rest; device theft / local inspection does not yield data.
- Large-capacity, structured, offline storage with no server dependency.
- The repository seam means Phase 3 adds a `SyncingRepository` (local + remote)
  without touching feature code.

**Negative / trade-offs**
- Passphrase-derived key with no escrow in Phase 1 → forgotten passphrase = data
  unrecoverable. Mitigated by clear setup messaging and export/backup; escrowed
  recovery arrives with the backend phase (with explicit consent).
- IndexedDB can be evicted by the browser under storage pressure (esp. iOS).
  Mitigated by export/backup and, later, cloud sync.
- Encryption adds per-record crypto cost; acceptable for PHR write/read volumes,
  and tuned via PBKDF2 iteration calibration.

## Alternatives considered

- **Plaintext IndexedDB/localStorage**: rejected — unacceptable for PHI.
- **Immediate backend with server-side storage**: rejected for Phase 1 — slower
  to launch, adds auth/ops/compliance surface before product validation, and
  breaks the offline-first requirement.
- **Bespoke crypto**: rejected — we use only vetted Web Crypto primitives.
