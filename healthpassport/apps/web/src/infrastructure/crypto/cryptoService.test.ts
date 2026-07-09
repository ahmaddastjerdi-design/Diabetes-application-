import { describe, expect, it } from 'vitest';
import {
  createKdfParams,
  decryptJson,
  deriveKey,
  encryptJson,
  randomBytes,
  sha256Hex,
} from './cryptoService';

// Use a low iteration count in tests for speed; production uses the default.
const FAST = 1000;

async function keyFor(passphrase: string, salt?: Uint8Array) {
  const params = createKdfParams(FAST);
  if (salt) params.salt = salt;
  return { key: await deriveKey(passphrase, params), params };
}

describe('cryptoService', () => {
  it('round-trips JSON under AES-GCM with matching key + AAD', async () => {
    const { key } = await keyFor('correct horse battery staple');
    const value = { glucose: 132, note: 'after lunch' };
    const blob = await encryptJson(key, 'Observation/abc', value);
    const out = await decryptJson<typeof value>(key, 'Observation/abc', blob);
    expect(out).toEqual(value);
  });

  it('produces ciphertext that does not contain the plaintext', async () => {
    const { key } = await keyFor('pw');
    const blob = await encryptJson(key, 'Observation/1', { secret: 'HbA1c-7.1' });
    const asText = new TextDecoder().decode(blob.ct);
    expect(asText).not.toContain('HbA1c');
    expect(blob.iv).toHaveLength(12);
  });

  it('rejects decryption with the wrong passphrase', async () => {
    const salt = randomBytes(16);
    const { key: right } = await keyFor('right', salt);
    const { key: wrong } = await keyFor('wrong', salt);
    const blob = await encryptJson(right, 'aad', { x: 1 });
    await expect(decryptJson(wrong, 'aad', blob)).rejects.toBeTruthy();
  });

  it('rejects decryption when the AAD does not match (record swap)', async () => {
    const { key } = await keyFor('pw');
    const blob = await encryptJson(key, 'Observation/1', { x: 1 });
    await expect(decryptJson(key, 'Observation/2', blob)).rejects.toBeTruthy();
  });

  it('rejects tampered ciphertext (GCM auth failure)', async () => {
    const { key } = await keyFor('pw');
    const blob = await encryptJson(key, 'aad', { x: 1 });
    const tampered = { iv: blob.iv, ct: new Uint8Array(blob.ct) };
    tampered.ct[0] = tampered.ct[0]! ^ 0xff;
    await expect(decryptJson(key, 'aad', tampered)).rejects.toBeTruthy();
  });

  it('hashes deterministically for the audit chain', async () => {
    expect(await sha256Hex('abc')).toBe(await sha256Hex('abc'));
    expect(await sha256Hex('abc')).not.toBe(await sha256Hex('abd'));
  });
});
