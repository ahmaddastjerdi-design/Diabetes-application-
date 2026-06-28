/**
 * auth.test.mjs — authorization, session, and audit-chain tests (Vol 9, Vol 8).
 * These are security-critical: they assert PHI cannot be reached without consent.
 */
import { test } from "node:test";
import assert from "node:assert/strict";
import {
  hasPermission,
  decideAccess,
  hasActiveConsent,
  validateClaims,
  appendEntry,
  verifyChain,
  chainHash,
} from "../dist/index.js";

const NOW = Date.parse("2026-06-01T00:00:00Z");

test("RBAC: roles only have their granted permissions; admin is all-powerful", () => {
  assert.equal(hasPermission("patient", "read:own"), true);
  assert.equal(hasPermission("patient", "read:patient"), false);
  assert.equal(hasPermission("nurse", "write:clinical"), false);
  assert.equal(hasPermission("admin", "write:clinical"), true);
});

test("a patient can reach only their own record", () => {
  const self = decideAccess({ id: "p1", role: "patient" }, "p1", [], NOW);
  assert.equal(self.allowed, true);
  const other = decideAccess({ id: "p1", role: "patient" }, "p2", [], NOW);
  assert.equal(other.allowed, false);
});

test("a clinician needs an active, unrevoked consent", () => {
  const consents = [
    { patientId: "p1", clinicianId: "c1", status: "active", grantedAt: NOW - 1000 },
  ];
  assert.equal(hasActiveConsent("c1", "p1", consents, NOW), true);
  assert.equal(decideAccess({ id: "c1", role: "clinician" }, "p1", consents, NOW).allowed, true);
  // a different clinician with no consent is denied
  assert.equal(decideAccess({ id: "c2", role: "clinician" }, "p1", consents, NOW).allowed, false);
});

test("revoked consent denies access from the revocation time", () => {
  const consents = [
    { patientId: "p1", clinicianId: "c1", status: "revoked", grantedAt: NOW - 2000, revokedAt: NOW - 100 },
  ];
  assert.equal(decideAccess({ id: "c1", role: "clinician" }, "p1", consents, NOW).allowed, false);
});

test("claims validation enforces expiry, audience, and MFA for clinicians", () => {
  const base = { sub: "c1", role: "clinician", scope: ["read:patient"], aud: "dq-api", exp: NOW / 1000 + 60, mfa: true };
  assert.equal(validateClaims(base, { now: NOW / 1000, audience: "dq-api", requireMfaFor: ["clinician"] }).valid, true);
  // expired
  assert.equal(validateClaims({ ...base, exp: NOW / 1000 - 1 }, { now: NOW / 1000, audience: "dq-api" }).valid, false);
  // wrong audience
  assert.equal(validateClaims({ ...base, aud: "other" }, { now: NOW / 1000, audience: "dq-api" }).valid, false);
  // clinician without MFA
  assert.equal(
    validateClaims({ ...base, mfa: false }, { now: NOW / 1000, audience: "dq-api", requireMfaFor: ["clinician"] }).valid,
    false
  );
});

test("audit chain links records and detects tampering", () => {
  let log = [];
  for (const a of ["login", "read:Patient/p1", "write:Observation"]) {
    log = [...log, appendEntry(log, { actorId: "c1", action: a, target: null, occurredAt: NOW })];
  }
  assert.equal(verifyChain(log).ok, true);
  // tamper with a record's action -> its stored hash no longer matches
  const tampered = log.map((r, i) => (i === 1 ? { ...r, action: "read:Patient/p2" } : r));
  const result = verifyChain(tampered);
  assert.equal(result.ok, false);
  assert.equal(result.brokenAt, 2);
  // sanity: chainHash is deterministic
  assert.equal(chainHash(null, { actorId: "a", action: "x", target: null, occurredAt: 1 }),
    chainHash(null, { actorId: "a", action: "x", target: null, occurredAt: 1 }));
});

test("audit chain hash is pluggable (production injects SHA-256)", () => {
  // a fake injected hasher proves the chain is hash-agnostic; storage uses SHA-256.
  const fake = (s) => `h(${s.length})`;
  let log = [];
  for (const a of ["login", "read"]) {
    log = [...log, appendEntry(log, { actorId: "c1", action: a, target: null, occurredAt: 5 }, fake)];
  }
  assert.equal(verifyChain(log, fake).ok, true);
  // verifying with the WRONG hasher detects the mismatch
  assert.equal(verifyChain(log).ok, false);
  assert.ok(log[0].hash.startsWith("h("));
});
