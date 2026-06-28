-- 0002_escalations.sql — care-team escalations raised by the AI coach (Vol 6 §escalation).
-- Observations already exist (0001). at_ms is epoch-ms BIGINT to match the TS core.

CREATE TABLE IF NOT EXISTS escalations (
  seq               BIGSERIAL PRIMARY KEY,
  patient_id        TEXT NOT NULL,
  tier              TEXT NOT NULL,
  audience          TEXT NOT NULL,
  notify_care_team  BOOLEAN NOT NULL,
  instruction       TEXT NOT NULL,
  at_ms             BIGINT NOT NULL,
  created_at        TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS escalations_patient_idx ON escalations (patient_id);
