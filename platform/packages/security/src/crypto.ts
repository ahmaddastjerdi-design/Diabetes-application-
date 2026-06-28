/**
 * crypto.ts — field-level encryption envelope + key rotation (Vol 8 §encryption / key mgmt).
 *
 * Pure: the AEAD primitive (AES-256-GCM) is INJECTED so this logic is testable without a
 * crypto runtime, and the same logic runs in production with node:crypto (see
 * services/backend/src/infra/crypto.ts). Encryption stamps the keyId, so after a key
 * rotation old ciphertext is still decryptable as long as the old key remains in the ring.
 */

export interface EncryptedField {
  alg: "AES-256-GCM";
  keyId: string;
  iv: string; // base64
  ciphertext: string; // base64
  tag: string; // base64 GCM auth tag
}

/** Which key encrypts new data; all listed keys can still decrypt old data. */
export interface KeyRing {
  activeKeyId: string;
  keyIds: string[];
}

/** The injected AEAD primitive (real impl uses AES-256-GCM via node:crypto). */
export interface Aead {
  seal(plaintext: string, keyId: string): { iv: string; ciphertext: string; tag: string };
  open(keyId: string, iv: string, ciphertext: string, tag: string): string;
}

export class KeyNotInRingError extends Error {}

/** Encrypt a plaintext field under the ring's ACTIVE key. */
export function encryptField(ring: KeyRing, aead: Aead, plaintext: string): EncryptedField {
  const sealed = aead.seal(plaintext, ring.activeKeyId);
  return { alg: "AES-256-GCM", keyId: ring.activeKeyId, iv: sealed.iv, ciphertext: sealed.ciphertext, tag: sealed.tag };
}

/** Decrypt using the field's own keyId (rotation-safe); rejects unknown keys. */
export function decryptField(ring: KeyRing, aead: Aead, field: EncryptedField): string {
  if (!ring.keyIds.includes(field.keyId)) throw new KeyNotInRingError(`unknown key ${field.keyId}`);
  return aead.open(field.keyId, field.iv, field.ciphertext, field.tag);
}
