/**
 * security.test.mjs — Vol 8 controls (Vol 9). The encryption suite wires the pure
 * envelope/rotation logic to REAL AES-256-GCM via node:crypto, verifying a true
 * round-trip, rotation, and tamper detection.
 */
import { test } from "node:test";
import assert from "node:assert/strict";
import { createCipheriv, createDecipheriv, randomBytes, createHmac } from "node:crypto";
import {
  redact,
  maskEmail,
  classifyField,
  requiresEncryptionAtRest,
  pseudonym,
  deidentify,
  buildExport,
  planErasure,
  encryptField,
  decryptField,
  KeyNotInRingError,
  securityHeaders,
} from "../dist/index.js";

test("redaction masks sensitive keys, emails, and tokens — never logs PHI", () => {
  const out = redact({
    email: "jane@example.com",
    note: "contact jane@example.com asap",
    authorization: "Bearer eyJabc.def.ghi",
    glucose: 145,
    safe: "ok",
  });
  assert.equal(out.email, "***redacted***");
  assert.equal(out.authorization, "***redacted***");
  assert.match(out.note, /j\*\*\*@example\.com/);
  assert.equal(out.safe, "ok");
  assert.equal(maskEmail("a.b@x.io"), "a***@x.io");
});

test("data classification flags PHI/PII for encryption at rest", () => {
  assert.equal(classifyField("fhir_patient"), "C4");
  assert.equal(classifyField("email"), "C3");
  assert.equal(classifyField("created_at"), "C2");
  assert.equal(requiresEncryptionAtRest("glucose_value"), true);
  assert.equal(requiresEncryptionAtRest("created_at"), false);
});

test("pseudonymization is deterministic and de-identifies records", () => {
  const hasher = { hmac: (s) => createHmac("sha256", "test-salt").update(s).digest("hex") };
  assert.equal(pseudonym("p1", hasher), pseudonym("p1", hasher));
  assert.notEqual(pseudonym("p1", hasher), pseudonym("p2", hasher));
  const d = deidentify({ patient_id: "p1", value: 7 }, ["patient_id"], hasher);
  assert.match(d.patient_id, /^pid_/);
  assert.equal(d.value, 7);
});

test("DSAR: export is portable; erasure deletes PII but retains pseudonymized audit", () => {
  const hasher = { hmac: (s) => createHmac("sha256", "salt").update(s).digest("hex") };
  const exp = buildExport("p1", { profile: { a: 1 }, observations: [], events: [] }, 1000);
  assert.equal(exp.subjectId, "p1");
  assert.equal(exp.format, "json");
  const plan = planErasure("p1", hasher);
  assert.ok(plan.deleted.includes("observations"));
  assert.ok(plan.pseudonymized.includes("audit_log")); // audit retained, not deleted
  assert.match(plan.pseudonymForAudit, /^pid_/);
});

// --- Real AES-256-GCM wired into the pure envelope logic ---
function nodeAead(keys) {
  return {
    seal(pt, keyId) {
      const iv = randomBytes(12);
      const c = createCipheriv("aes-256-gcm", keys[keyId], iv);
      const ct = Buffer.concat([c.update(pt, "utf8"), c.final()]);
      return { iv: iv.toString("base64"), ciphertext: ct.toString("base64"), tag: c.getAuthTag().toString("base64") };
    },
    open(keyId, iv, ct, tag) {
      const d = createDecipheriv("aes-256-gcm", keys[keyId], Buffer.from(iv, "base64"));
      d.setAuthTag(Buffer.from(tag, "base64"));
      return Buffer.concat([d.update(Buffer.from(ct, "base64")), d.final()]).toString("utf8");
    },
  };
}

test("field encryption: real AES-256-GCM round-trip", () => {
  const keys = { k1: randomBytes(32) };
  const ring = { activeKeyId: "k1", keyIds: ["k1"] };
  const aead = nodeAead(keys);
  const field = encryptField(ring, aead, "patient@example.com");
  assert.equal(field.alg, "AES-256-GCM");
  assert.notEqual(field.ciphertext, "patient@example.com");
  assert.equal(decryptField(ring, aead, field), "patient@example.com");
});

test("key rotation: data encrypted under an old key still decrypts", () => {
  const keys = { k1: randomBytes(32), k2: randomBytes(32) };
  const aead = nodeAead(keys);
  const oldRing = { activeKeyId: "k1", keyIds: ["k1"] };
  const field = encryptField(oldRing, aead, "secret");
  // rotate: k2 is now active, k1 retained for decryption
  const rotated = { activeKeyId: "k2", keyIds: ["k2", "k1"] };
  assert.equal(decryptField(rotated, aead, field), "secret");
  // a ring without the field's key refuses
  assert.throws(() => decryptField({ activeKeyId: "k2", keyIds: ["k2"] }, aead, field), KeyNotInRingError);
});

test("tampered ciphertext fails the GCM auth tag", () => {
  const keys = { k1: randomBytes(32) };
  const ring = { activeKeyId: "k1", keyIds: ["k1"] };
  const aead = nodeAead(keys);
  const field = encryptField(ring, aead, "secret");
  const tampered = { ...field, ciphertext: Buffer.from("evil").toString("base64") };
  assert.throws(() => decryptField(ring, aead, tampered));
});

test("security headers include HSTS and nosniff", () => {
  const h = securityHeaders();
  assert.ok(h["Strict-Transport-Security"].includes("max-age"));
  assert.equal(h["X-Content-Type-Options"], "nosniff");
  assert.equal(h["X-Frame-Options"], "DENY");
});
