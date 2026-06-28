/**
 * crypto.ts (infra) — production crypto primitives (Vol 8 §encryption / key mgmt).
 * Provides the real AES-256-GCM AEAD, SHA-256 audit hashing, and the HMAC pseudonym
 * hasher that the pure @diabetes-quest/security envelope/DSAR logic injects. Keys come
 * from the environment / a KMS in deployment. Built via tsconfig.full.json.
 */
import { createCipheriv, createDecipheriv, randomBytes, createHash, createHmac } from "node:crypto";
import type { Aead, KeyRing, Hasher } from "@diabetes-quest/security";

type KeyMap = Record<string, Buffer>;

/** ENCRYPTION_KEYS = '{"k1":"<base64 32-byte key>", ...}' (a KMS in production). */
function parseKeys(): KeyMap {
  const raw = process.env.ENCRYPTION_KEYS;
  if (!raw) return {};
  const obj = JSON.parse(raw) as Record<string, string>;
  const out: KeyMap = {};
  for (const [id, b64] of Object.entries(obj)) out[id] = Buffer.from(b64, "base64");
  return out;
}

export function nodeAead(keys: KeyMap = parseKeys()): Aead {
  const keyFor = (id: string): Buffer => {
    const k = keys[id];
    if (!k) throw new Error(`encryption key '${id}' not available`);
    return k;
  };
  return {
    seal(plaintext, keyId) {
      const iv = randomBytes(12);
      const c = createCipheriv("aes-256-gcm", keyFor(keyId), iv);
      const ct = Buffer.concat([c.update(plaintext, "utf8"), c.final()]);
      return { iv: iv.toString("base64"), ciphertext: ct.toString("base64"), tag: c.getAuthTag().toString("base64") };
    },
    open(keyId, iv, ciphertext, tag) {
      const d = createDecipheriv("aes-256-gcm", keyFor(keyId), Buffer.from(iv, "base64"));
      d.setAuthTag(Buffer.from(tag, "base64"));
      return Buffer.concat([d.update(Buffer.from(ciphertext, "base64")), d.final()]).toString("utf8");
    },
  };
}

export function keyRingFromEnv(): KeyRing {
  const ids = Object.keys(parseKeys());
  return { activeKeyId: process.env.ACTIVE_KEY_ID ?? ids[0] ?? "", keyIds: ids };
}

/** Cryptographic audit-chain hash — the production upgrade from the core djb2 model. */
export function sha256Hex(input: string): string {
  return createHash("sha256").update(input).digest("hex");
}

/** Keyed pseudonym hasher for de-identification / DSAR (HMAC-SHA256 with a secret salt). */
export function hmacHasher(secret: string = process.env.PSEUDONYM_SALT ?? ""): Hasher {
  return { hmac: (input: string) => createHmac("sha256", secret).update(input).digest("hex") };
}
