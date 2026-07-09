import {
  decryptJson,
  encryptJson,
  type EncryptedBlob,
} from './cryptoService';

/**
 * Binds an unlocked session key to encrypt/decrypt whole records. The `aad`
 * (additional authenticated data) binds each ciphertext to its record identity
 * so blobs cannot be swapped between records.
 */
export interface RecordCipher {
  encrypt(aad: string, value: unknown): Promise<EncryptedBlob>;
  decrypt<T>(aad: string, blob: EncryptedBlob): Promise<T>;
}

export function createRecordCipher(key: CryptoKey): RecordCipher {
  return {
    encrypt: (aad, value) => encryptJson(key, aad, value),
    decrypt: (aad, blob) => decryptJson(key, aad, blob),
  };
}
