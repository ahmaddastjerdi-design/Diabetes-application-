import { describe, expect, it } from 'vitest';
import {
  MAX_UPLOAD_BYTES,
  sniffType,
  validateUpload,
} from '@/lib/upload/validate';
import { assertSafeKey } from '@/lib/storage/types';

const PDF = new Uint8Array([0x25, 0x50, 0x44, 0x46, 0x2d, 0x31]); // %PDF-1
const PNG = new Uint8Array([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a, 0x00]);
const JPG = new Uint8Array([0xff, 0xd8, 0xff, 0xe0, 0x00]);
const EXE = new Uint8Array([0x4d, 0x5a, 0x90, 0x00]); // MZ (Windows executable)

describe('file-type sniffing', () => {
  it('recognizes allowed types by magic bytes', () => {
    expect(sniffType(PDF)?.mime).toBe('application/pdf');
    expect(sniffType(PNG)?.mime).toBe('image/png');
    expect(sniffType(JPG)?.mime).toBe('image/jpeg');
  });
  it('rejects disallowed content (e.g. an executable)', () => {
    expect(sniffType(EXE)).toBeNull();
  });
});

describe('validateUpload', () => {
  it('accepts a valid PDF with a matching extension', () => {
    expect(validateUpload('report.pdf', PDF.length, PDF).ok).toBe(true);
  });

  it('rejects content/extension mismatch (a PNG named .pdf)', () => {
    const r = validateUpload('sneaky.pdf', PNG.length, PNG);
    expect(r.ok).toBe(false);
    expect(r.error).toMatch(/extension/i);
  });

  it('rejects a disguised executable regardless of name', () => {
    expect(validateUpload('invoice.pdf', EXE.length, EXE).ok).toBe(false);
  });

  it('rejects empty and oversized files', () => {
    expect(validateUpload('a.pdf', 0, new Uint8Array()).ok).toBe(false);
    expect(validateUpload('big.pdf', MAX_UPLOAD_BYTES + 1, PDF).ok).toBe(false);
  });

  it('accepts .jpeg as an alias for jpg', () => {
    expect(validateUpload('scan.jpeg', JPG.length, JPG).ok).toBe(true);
  });
});

describe('storage key safety', () => {
  it('accepts server-generated keys and rejects traversal', () => {
    expect(() => assertSafeKey('a1b2c3.pdf')).not.toThrow();
    expect(() => assertSafeKey('../etc/passwd')).toThrow();
    expect(() => assertSafeKey('a/b.pdf')).toThrow();
  });
});
