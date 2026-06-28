/**
 * redaction.ts — PHI/PII redaction for logs & diagnostics (Vol 8: "no PHI in logs").
 * Pure deep redaction: sensitive keys are masked by name, and free-text values have
 * emails and bearer/JWT tokens masked. Use before anything reaches a log sink.
 */

/** Field names whose values must never appear in logs (case-insensitive). */
export const SENSITIVE_KEYS: ReadonlySet<string> = new Set(
  [
    "password", "token", "authorization", "access_token", "refresh_token", "secret",
    "email", "dob", "date_of_birth", "ssn", "mrn", "phone", "address",
    "fhir_patient", "fhir_practitioner", "value", "valuequantity",
  ].map((k) => k.toLowerCase())
);

const EMAIL = /([a-zA-Z0-9._%+-])[a-zA-Z0-9._%+-]*(@[a-zA-Z0-9.-]+)/g;
const JWT = /\beyJ[a-zA-Z0-9_-]+\.[a-zA-Z0-9_-]+\.[a-zA-Z0-9_-]+\b/g;

export function maskEmail(s: string): string {
  return s.replace(EMAIL, (_m, first: string, domain: string) => `${first}***${domain}`);
}

export function maskTokens(s: string): string {
  return s.replace(JWT, "***redacted-token***");
}

function redactString(s: string): string {
  return maskTokens(maskEmail(s));
}

/** Deep-clone `value`, masking sensitive keys and tokens/emails in strings. */
export function redact(value: unknown): unknown {
  if (typeof value === "string") return redactString(value);
  if (Array.isArray(value)) return value.map(redact);
  if (value && typeof value === "object") {
    const out: Record<string, unknown> = {};
    for (const [k, v] of Object.entries(value)) {
      out[k] = SENSITIVE_KEYS.has(k.toLowerCase()) ? "***redacted***" : redact(v);
    }
    return out;
  }
  return value;
}
