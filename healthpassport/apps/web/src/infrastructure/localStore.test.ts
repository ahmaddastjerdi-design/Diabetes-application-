import { beforeEach, describe, expect, it } from 'vitest';
import { createLocalHealthStore } from './localStore';
import { openHpDb } from './storage/db';
import { VaultLockedError, WrongPassphraseError } from './session/vault';
import { newId, nowInstant } from '../domain/ids';
import { concept, quantity, SYSTEMS } from '../domain/primitives';
import type { Observation } from '../domain/resources';

const PASS = 'a-strong-passphrase-123';
// Low KDF cost for test speed; production uses the default iteration count.
const FAST_ITER = 800;

let dbName: string;
let counter = 0;

beforeEach(() => {
  // Unique DB per test (fake-indexeddb is process-global).
  counter += 1;
  dbName = `hp-test-${counter}-${Math.floor(Math.random() * 1e9)}`;
});

function makeGlucose(value: number, note?: string): Observation {
  return {
    resourceType: 'Observation',
    id: newId(),
    updatedAt: nowInstant(),
    status: 'final',
    code: concept({
      system: SYSTEMS.LOINC,
      code: '2339-0',
      display: 'Glucose [Mass/volume] in Blood',
    }),
    effectiveDateTime: nowInstant(),
    valueQuantity: quantity(value, 'mg/dL', 'mg/dL'),
    ...(note ? { note } : {}),
  };
}

describe('Vault', () => {
  it('initializes, unlocks, and locks', async () => {
    const { vault } = await createLocalHealthStore(dbName);
    expect(await vault.isInitialized()).toBe(false);
    await vault.initialize(PASS, FAST_ITER);
    expect(vault.isUnlocked).toBe(true);
    expect(await vault.isInitialized()).toBe(true);

    vault.lock();
    expect(vault.isUnlocked).toBe(false);
    expect(() => vault.cipher()).toThrow(VaultLockedError);
  });

  it('rejects a wrong passphrase and accepts the correct one', async () => {
    const first = await createLocalHealthStore(dbName);
    await first.vault.initialize(PASS, FAST_ITER);

    // Simulate a fresh app load against the same database.
    const reopened = await createLocalHealthStore(dbName);
    await expect(reopened.vault.unlock('nope')).rejects.toBeInstanceOf(
      WrongPassphraseError,
    );
    await expect(reopened.vault.unlock(PASS)).resolves.toBeUndefined();
    expect(reopened.vault.isUnlocked).toBe(true);
  });
});

describe('EncryptedIndexedDbRepository', () => {
  it('stores and retrieves resources round-trip', async () => {
    const { vault, repository } = await createLocalHealthStore(dbName);
    await vault.initialize(PASS, FAST_ITER);

    const g1 = makeGlucose(120, 'fasting');
    await repository.put(g1);
    const got = await repository.get('Observation', g1.id);
    expect(got).toEqual(g1);

    await repository.put(makeGlucose(200));
    const list = await repository.list('Observation');
    expect(list).toHaveLength(2);

    await repository.remove('Observation', g1.id);
    expect(await repository.get('Observation', g1.id)).toBeUndefined();
    expect(await repository.list('Observation')).toHaveLength(1);
  });

  it('encrypts PHI at rest — raw stored bytes do not contain the note', async () => {
    const { vault, repository } = await createLocalHealthStore(dbName);
    await vault.initialize(PASS, FAST_ITER);
    await repository.put(makeGlucose(150, 'SECRET-NOTE-XYZ'));

    // Inspect the raw IndexedDB row.
    const raw = await openHpDb(dbName);
    const rows = await raw.getAll('records');
    expect(rows).toHaveLength(1);
    const bytesAsText = new TextDecoder().decode(rows[0]!.ct);
    expect(bytesAsText).not.toContain('SECRET-NOTE-XYZ');
    expect(bytesAsText).not.toContain('Glucose');
    // Metadata is intentionally in the clear for indexing.
    expect(rows[0]!.resourceType).toBe('Observation');
  });

  it('cannot read records while locked', async () => {
    const { vault, repository } = await createLocalHealthStore(dbName);
    await vault.initialize(PASS, FAST_ITER);
    await repository.put(makeGlucose(100));
    vault.lock();
    await expect(repository.list('Observation')).rejects.toBeInstanceOf(
      VaultLockedError,
    );
  });

  it('clear() removes all records', async () => {
    const { vault, repository } = await createLocalHealthStore(dbName);
    await vault.initialize(PASS, FAST_ITER);
    await repository.put(makeGlucose(100));
    await repository.put(makeGlucose(110));
    await repository.clear();
    expect(await repository.list('Observation')).toHaveLength(0);
  });
});

describe('AuditLog', () => {
  it('records access events in a verifiable hash chain', async () => {
    const { vault, repository, audit } = await createLocalHealthStore(dbName);
    await vault.initialize(PASS, FAST_ITER);
    await repository.put(makeGlucose(100));
    await repository.put(makeGlucose(110));
    await repository.exportAll();

    const entries = await audit.list();
    expect(entries.length).toBe(3);
    expect(entries.map((e) => e.action)).toEqual(['put', 'put', 'export']);
    expect(await audit.verifyChain()).toBe(true);
  });

  it('detects tampering with audit history', async () => {
    const { vault, repository, audit } = await createLocalHealthStore(dbName);
    await vault.initialize(PASS, FAST_ITER);
    await repository.put(makeGlucose(100));
    await repository.put(makeGlucose(110));
    expect(await audit.verifyChain()).toBe(true);

    // Tamper: rewrite the first entry's action directly in IndexedDB.
    const raw = await openHpDb(dbName);
    const all = await raw.getAll('audit');
    const first = all[0]!;
    first.action = 'clear';
    await raw.put('audit', first);

    expect(await audit.verifyChain()).toBe(false);
  });
});
