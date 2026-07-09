import {
  createKdfParams,
  decryptJson,
  deriveKey,
  encryptJson,
  type EncryptedBlob,
  type KdfParams,
} from '../crypto/cryptoService';
import { createRecordCipher, type RecordCipher } from '../crypto/recordCipher';
import type { HpDatabase } from '../storage/db';

const KDF_KEY = 'kdf';
const VERIFIER_KEY = 'verifier';
const VERIFIER_AAD = 'session/verifier';
const VERIFIER_TOKEN = { hp: 'verifier', v: 1 } as const;

/** Thrown when a passphrase fails to unlock the vault. */
export class WrongPassphraseError extends Error {
  constructor() {
    super('Incorrect passphrase.');
    this.name = 'WrongPassphraseError';
  }
}

/** Thrown when a record operation is attempted while the vault is locked. */
export class VaultLockedError extends Error {
  constructor() {
    super('The record is locked. Unlock it first.');
    this.name = 'VaultLockedError';
  }
}

/**
 * Holds the passphrase-derived key in memory for the duration of an unlocked
 * session. The key is never persisted; locking discards it. A small encrypted
 * "verifier" record lets us check a passphrase without storing it. See
 * docs/SECURITY.md §3.
 */
export class Vault {
  private key: CryptoKey | null = null;

  constructor(private readonly db: HpDatabase) {}

  async isInitialized(): Promise<boolean> {
    return (await this.db.get('meta', KDF_KEY)) !== undefined;
  }

  get isUnlocked(): boolean {
    return this.key !== null;
  }

  /** First-run setup: choose a passphrase and seed KDF params + verifier. */
  async initialize(
    passphrase: string,
    iterations?: number,
  ): Promise<void> {
    if (await this.isInitialized()) {
      throw new Error('Vault already initialized.');
    }
    const params = createKdfParams(iterations);
    const key = await deriveKey(passphrase, params);
    const verifier = await encryptJson(key, VERIFIER_AAD, VERIFIER_TOKEN);
    await this.db.put('meta', { key: KDF_KEY, value: serializeKdf(params) });
    await this.db.put('meta', { key: VERIFIER_KEY, value: verifier });
    this.key = key;
  }

  /** Unlock with a passphrase. Throws WrongPassphraseError on mismatch. */
  async unlock(passphrase: string): Promise<void> {
    const kdfMeta = await this.db.get('meta', KDF_KEY);
    const verifierMeta = await this.db.get('meta', VERIFIER_KEY);
    if (!kdfMeta || !verifierMeta) {
      throw new Error('Vault is not initialized.');
    }
    const params = deserializeKdf(kdfMeta.value);
    const key = await deriveKey(passphrase, params);
    try {
      await decryptJson(key, VERIFIER_AAD, verifierMeta.value as EncryptedBlob);
    } catch {
      throw new WrongPassphraseError();
    }
    this.key = key;
  }

  lock(): void {
    this.key = null;
  }

  cipher(): RecordCipher {
    if (!this.key) throw new VaultLockedError();
    return createRecordCipher(this.key);
  }
}

// KDF params contain a Uint8Array salt; IndexedDB stores typed arrays directly,
// but we keep an explicit (de)serialize seam for clarity and future backends.
interface SerializedKdf {
  salt: Uint8Array;
  iterations: number;
  hash: 'SHA-256';
}

function serializeKdf(params: KdfParams): SerializedKdf {
  return { salt: params.salt, iterations: params.iterations, hash: params.hash };
}

function deserializeKdf(value: unknown): KdfParams {
  const v = value as SerializedKdf;
  return { salt: v.salt, iterations: v.iterations, hash: v.hash };
}
