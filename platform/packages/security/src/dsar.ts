/**
 * dsar.ts — GDPR data-subject requests (Vol 8 §privacy-by-design / DSAR handling).
 * buildExport assembles a portable copy of the subject's data (Art. 15/20). planErasure
 * encodes the right-to-erasure policy (Art. 17): personal data is deleted, but audit
 * records are RETAINED with the actor pseudonymized — security logs are a legal basis to
 * keep, and erasing them would defeat HIPAA accountability.
 */
import { pseudonym, type Hasher } from "./pseudonymize.js";

export interface SubjectData {
  profile: Record<string, unknown>;
  observations: unknown[];
  events: unknown[];
}

export interface DataExport {
  subjectId: string;
  exportedAtMs: number;
  format: "json";
  data: SubjectData;
}

export function buildExport(subjectId: string, data: SubjectData, atMs: number): DataExport {
  return { subjectId, exportedAtMs: atMs, format: "json", data };
}

export interface ErasurePlan {
  subjectId: string;
  /** Tables/collections whose rows are hard-deleted. */
  deleted: string[];
  /** Retained for legal/accountability reasons, with identifiers pseudonymized. */
  pseudonymized: string[];
  pseudonymForAudit: string;
}

export function planErasure(subjectId: string, hasher: Hasher): ErasurePlan {
  return {
    subjectId,
    deleted: ["patients", "observations", "domain_events", "devices", "consents"],
    pseudonymized: ["audit_log"],
    pseudonymForAudit: pseudonym(subjectId, hasher),
  };
}
