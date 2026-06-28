/**
 * observations.ts — validation & idempotency for incoming FHIR Observations (Vol 4 §ingest).
 *
 * Pure, framework-free domain logic: the Fastify route in server.ts is a thin adapter
 * over these functions. Keeping the logic pure makes it directly unit-testable (Vol 9).
 */
import type { Observation } from "@diabetes-quest/shared";
import { djb2 } from "./hash.js";

export interface ValidationResult {
  ok: boolean;
  errors: string[];
}

/** Validate an Observation submitted by the app or device-gateway. */
export function validateObservation(o: Observation): ValidationResult {
  const errors: string[] = [];
  if (o.resourceType !== "Observation") errors.push("resourceType must be 'Observation'");
  if (!o.code?.coding?.length) errors.push("code.coding is required");
  if (!o.subject?.reference?.startsWith("Patient/")) errors.push("subject must reference a Patient");
  if (!o.effectiveDateTime || Number.isNaN(Date.parse(o.effectiveDateTime)))
    errors.push("effectiveDateTime must be a valid ISO 8601 instant");
  if (typeof o.valueQuantity?.value !== "number" || Number.isNaN(o.valueQuantity.value))
    errors.push("valueQuantity.value must be a number");
  return { ok: errors.length === 0, errors };
}

/**
 * Deterministic idempotency key for an Observation (Vol 4 §sync / Vol 5 §queue).
 * Same measurement submitted twice -> same key -> stored once. If the client supplied
 * its own identifier we honour it; otherwise we derive one from the stable fields.
 */
export function idempotencyKey(o: Observation): string {
  const supplied = o.identifier?.[0];
  if (supplied) return `${supplied.system}|${supplied.value}`;
  const code = o.code.coding[0]?.code ?? "?";
  return djb2(`${o.subject.reference}|${code}|${o.effectiveDateTime}|${o.valueQuantity.value}`);
}
