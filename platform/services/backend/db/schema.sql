-- schema.sql — core relational schema (Vol 4 §database specification).
-- Illustrative starting point for Phase 1; column types/constraints firm up with the
-- chosen migration tool. PHI columns are noted; encryption-at-rest is required (Vol 8).

CREATE TABLE users (
  id            UUID PRIMARY KEY,
  email         TEXT NOT NULL UNIQUE,           -- PHI
  role          TEXT NOT NULL CHECK (role IN ('patient','clinician','nurse','admin')),
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE patients (
  user_id       UUID PRIMARY KEY REFERENCES users(id),
  fhir_patient  JSONB NOT NULL,                 -- FHIR Patient resource (PHI)
  diabetes_type TEXT CHECK (diabetes_type IN ('t1','t2','gestational','other'))
);

CREATE TABLE clinicians (
  user_id       UUID PRIMARY KEY REFERENCES users(id),
  fhir_practitioner JSONB NOT NULL
);

-- Patient-consent gates all clinician access (Vol 3/4/8).
CREATE TABLE consents (
  id            UUID PRIMARY KEY,
  patient_id    UUID NOT NULL REFERENCES patients(user_id),
  clinician_id  UUID NOT NULL REFERENCES clinicians(user_id),
  scope         TEXT NOT NULL,
  status        TEXT NOT NULL CHECK (status IN ('active','revoked')),
  granted_at    TIMESTAMPTZ NOT NULL DEFAULT now(),
  revoked_at    TIMESTAMPTZ
);

-- Measurements as FHIR Observations; idempotency_key enforces dedup (Vol 4/5).
CREATE TABLE observations (
  id              UUID PRIMARY KEY,
  patient_id      UUID NOT NULL REFERENCES patients(user_id),
  idempotency_key TEXT NOT NULL UNIQUE,
  fhir            JSONB NOT NULL,
  effective_at    TIMESTAMPTZ NOT NULL,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Append-only event log: the authority for derived XP/streak/badges (Vol 4 §gamification).
CREATE TABLE domain_events (
  seq           BIGSERIAL PRIMARY KEY,
  patient_id    UUID NOT NULL REFERENCES patients(user_id),
  type          TEXT NOT NULL,
  payload       JSONB NOT NULL,
  occurred_at   TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE devices (
  id            UUID PRIMARY KEY,
  patient_id    UUID NOT NULL REFERENCES patients(user_id),
  fhir_device   JSONB NOT NULL,                 -- FHIR Device (+ firmware), Vol 5
  paired_at     TIMESTAMPTZ NOT NULL DEFAULT now(),
  revoked_at    TIMESTAMPTZ
);

-- Immutable, hash-chained audit trail (HIPAA; Vol 8). prev_hash links the chain.
CREATE TABLE audit_log (
  seq           BIGSERIAL PRIMARY KEY,
  actor_id      UUID,
  action        TEXT NOT NULL,
  target        TEXT,
  occurred_at   TIMESTAMPTZ NOT NULL DEFAULT now(),
  prev_hash     TEXT,
  hash          TEXT NOT NULL
);
