// All cryptography uses the platform Web Crypto API. No bespoke primitives.
// See docs/SECURITY.md §3 for the at-rest encryption design.

export interface KdfParams {
  salt: Uint8Array;
  iterations: number;
  hash: 'SHA-256';
}

export interface EncryptedBlob {
  /** 96-bit AES-GCM nonce, unique per record. */
  iv: Uint8Array;
  /** Ciphertext (includes the GCM auth tag). */
  ct: Uint8Array;
}

/** OWASP-aligned PBKDF2 iteration count for PBKDF2-HMAC-SHA-256 (2023+). */
export const DEFAULT_PBKDF2_ITERATIONS = 310_000;

const encoder = new TextEncoder();
const decoder = new TextDecoder();

// Web Crypto accepts Uint8Array at runtime; under TS 5.7+ generic typed arrays,
// the DOM lib's BufferSource type is stricter about the backing buffer, so we
// assert at the call boundary. Value semantics are unchanged.
function buf(bytes: Uint8Array): BufferSource {
  return bytes as BufferSource;
}

export function randomBytes(length: number): Uint8Array {
  const bytes = new Uint8Array(length);
  crypto.getRandomValues(bytes);
  return bytes;
}

export function createKdfParams(
  iterations: number = DEFAULT_PBKDF2_ITERATIONS,
): KdfParams {
  return { salt: randomBytes(16), iterations, hash: 'SHA-256' };
}

/**
 * Derive a non-extractable AES-GCM key from a passphrase. The key never leaves
 * the crypto subsystem and is never serialized.
 */
export async function deriveKey(
  passphrase: string,
  params: KdfParams,
): Promise<CryptoKey> {
  const baseKey = await crypto.subtle.importKey(
    'raw',
    buf(encoder.encode(passphrase)),
    'PBKDF2',
    false,
    ['deriveKey'],
  );
  return crypto.subtle.deriveKey(
    {
      name: 'PBKDF2',
      salt: buf(params.salt),
      iterations: params.iterations,
      hash: params.hash,
    },
    baseKey,
    { name: 'AES-GCM', length: 256 },
    false, // non-extractable
    ['encrypt', 'decrypt'],
  );
}

export async function encryptBytes(
  key: CryptoKey,
  aad: string,
  plaintext: Uint8Array,
): Promise<EncryptedBlob> {
  const iv = randomBytes(12);
  const ct = await crypto.subtle.encrypt(
    { name: 'AES-GCM', iv: buf(iv), additionalData: buf(encoder.encode(aad)) },
    key,
    buf(plaintext),
  );
  return { iv, ct: new Uint8Array(ct) };
}

export async function decryptBytes(
  key: CryptoKey,
  aad: string,
  blob: EncryptedBlob,
): Promise<Uint8Array> {
  // Throws (GCM auth failure) if the key is wrong or the ciphertext/AAD was
  // tampered with — callers rely on this for tamper-rejection and unlock checks.
  const pt = await crypto.subtle.decrypt(
    { name: 'AES-GCM', iv: buf(blob.iv), additionalData: buf(encoder.encode(aad)) },
    key,
    buf(blob.ct),
  );
  return new Uint8Array(pt);
}

export async function encryptJson(
  key: CryptoKey,
  aad: string,
  value: unknown,
): Promise<EncryptedBlob> {
  return encryptBytes(key, aad, encoder.encode(JSON.stringify(value)));
}

export async function decryptJson<T>(
  key: CryptoKey,
  aad: string,
  blob: EncryptedBlob,
): Promise<T> {
  const bytes = await decryptBytes(key, aad, blob);
  return JSON.parse(decoder.decode(bytes)) as T;
}

/** SHA-256 hex digest — used by the tamper-evident audit chain. */
export async function sha256Hex(input: string): Promise<string> {
  const digest = await crypto.subtle.digest('SHA-256', buf(encoder.encode(input)));
  return [...new Uint8Array(digest)]
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('');
}
