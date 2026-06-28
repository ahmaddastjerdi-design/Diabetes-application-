/**
 * classification.ts — data classification (Vol 8 §data classification).
 * C1 public · C2 internal · C3 PII · C4 PHI/sensitive. Drives handling rules
 * (encryption at rest, redaction, access). classifyField errs toward higher sensitivity.
 */
export type DataClass = "C1" | "C2" | "C3" | "C4";

const C4_PHI = ["fhir_patient", "fhir_practitioner", "glucose", "observation", "valuequantity", "diabetes_type", "mrn", "ssn", "dob", "date_of_birth"];
const C3_PII = ["email", "name", "phone", "address", "user_id", "patient_id"];

export function classifyField(name: string): DataClass {
  const n = name.toLowerCase();
  if (C4_PHI.some((k) => n.includes(k))) return "C4";
  if (C3_PII.some((k) => n.includes(k))) return "C3";
  return "C2";
}

/** True when a field must be encrypted at rest (C3/C4). */
export function requiresEncryptionAtRest(name: string): boolean {
  const c = classifyField(name);
  return c === "C3" || c === "C4";
}
