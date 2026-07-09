import { mkdir, readFile, unlink, writeFile } from 'node:fs/promises';
import { join } from 'node:path';
import { assertSafeKey, type StorageAdapter } from './types';

/**
 * Local filesystem storage — files are written OUTSIDE the web root (a
 * gitignored directory) and only ever served through the auth+ownership-gated
 * document route. Never executed. Suitable for development; production uses S3.
 */
export class LocalStorageAdapter implements StorageAdapter {
  constructor(private readonly baseDir: string) {}

  private path(key: string): string {
    assertSafeKey(key);
    return join(this.baseDir, key);
  }

  async put(key: string, bytes: Uint8Array, _contentType: string): Promise<void> {
    void _contentType;
    await mkdir(this.baseDir, { recursive: true });
    await writeFile(this.path(key), bytes);
  }

  async get(key: string): Promise<Uint8Array> {
    return new Uint8Array(await readFile(this.path(key)));
  }

  async delete(key: string): Promise<void> {
    await unlink(this.path(key)).catch(() => {
      /* already gone — treat as success */
    });
  }
}
