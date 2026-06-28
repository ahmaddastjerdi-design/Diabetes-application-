-- 0001_init.sql — core schema (Vol 4 §database, Vol 8). Applied by src/infra/migrate.ts.
-- Time columns the domain compares are epoch-ms BIGINT (matching the TS core); created_at
-- stays TIMESTAMPTZ for record-keeping. PHI columns are noted; encryption-at-rest required.

CREATE TABLE IF NOT EXISTS users (
  id            UUID PRIMARY KEY,
  email         TEXT NOT NULL UNIQUE,            -- PHI
  role          TEXT NOT NULL CHECK (role IN ('patient','clinician','nurse','admin')),
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS patients (
  user_id       UUID PRIMARY KEY REFERENCES users(id),
  fhir_patient  JSONB NOT NULL,                  -- FHIR Patient (PHI)
  diabetes_type TEXT CHECK (diabetes_type IN ('t1','t2','gestational','other'))
);

CREATE TABLE IF NOT EXISTS clinicians (
  user_id           UUID PRIMARY KEY REFERENCES users(id),
  fhir_practitioner JSONB NOT NULL
);

-- Patient consent gates all clinician access (Vol 3/4/8).
CREATE TABLE IF NOT EXISTS consents (
  id            BIGSERIAL PRIMARY KEY,
  patient_id    TEXT NOT NULL,
  clinician_id  TEXT NOT NULL,
  status        TEXT NOT NULL CHECK (status IN ('active','revoked')),
  granted_at    BIGINT NOT NULL,                 -- epoch ms
  revoked_at    BIGINT,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS consents_patient_idx ON consents (patient_id);

-- Append-only event log: the authority for derived XP/streak/badges (Vol 4 §gamification).
-- idem_key makes ingest idempotent per patient (Vol 4 §sync, Vol 5 §queue).
CREATE TABLE IF NOT EXISTS domain_events (
  seq           BIGSERIAL PRIMARY KEY,
  patient_id    TEXT NOT NULL,
  idem_key      TEXT NOT NULL,
  type          TEXT NOT NULL,
  payload       JSONB NOT NULL,
  occurred_at   TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (patient_id, idem_key)
);
CREATE INDEX IF NOT EXISTS domain_events_patient_idx ON domain_events (patient_id, seq);

CREATE TABLE IF NOT EXISTS observations (
  id              BIGSERIAL PRIMARY KEY,
  patient_id      TEXT NOT NULL,
  idempotency_key TEXT NOT NULL UNIQUE,
  fhir            JSONB NOT NULL,
  effective_at    TIMESTAMPTZ NOT NULL,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS devices (
  id            UUID PRIMARY KEY,
  patient_id    TEXT NOT NULL,
  fhir_device   JSONB NOT NULL,
  paired_at     TIMESTAMPTZ NOT NULL DEFAULT now(),
  revoked_at    TIMESTAMPTZ
);

-- Immutable, hash-chained audit trail (HIPAA; Vol 8). prev_hash links the chain.
CREATE TABLE IF NOT EXISTS audit_log (
  seq           BIGSERIAL PRIMARY KEY,
  actor_id      TEXT,
  action        TEXT NOT NULL,
  target        TEXT,
  occurred_at   BIGINT NOT NULL,                 -- epoch ms
  prev_hash     TEXT,
  hash          TEXT NOT NULL
);
