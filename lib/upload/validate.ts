// Secure file-upload validation (docs/SECURITY_CHECKLIST.md §4): allowlist by
// MIME + extension AND verify magic bytes, enforce a max size, and never trust
// the client-provided content type alone.

export const MAX_UPLOAD_BYTES = 10 * 1024 * 1024; // 10 MB

export interface AllowedType {
  mime: string;
  ext: string;
  /** Returns true if the leading bytes match this type's signature. */
  matches: (bytes: Uint8Array) => boolean;
}

function startsWith(bytes: Uint8Array, sig: number[]): boolean {
  if (bytes.length < sig.length) return false;
  return sig.every((b, i) => bytes[i] === b);
}

export const ALLOWED_TYPES: AllowedType[] = [
  { mime: 'application/pdf', ext: 'pdf', matches: (b) => startsWith(b, [0x25, 0x50, 0x44, 0x46]) }, // %PDF
  { mime: 'image/png', ext: 'png', matches: (b) => startsWith(b, [0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]) },
  { mime: 'image/jpeg', ext: 'jpg', matches: (b) => startsWith(b, [0xff, 0xd8, 0xff]) },
  {
    mime: 'image/webp',
    ext: 'webp',
    matches: (b) =>
      b.length >= 12 &&
      startsWith(b, [0x52, 0x49, 0x46, 0x46]) && // RIFF
      b[8] === 0x57 && b[9] === 0x45 && b[10] === 0x42 && b[11] === 0x50, // WEBP
  },
];

/** Sniff the true type from magic bytes; null if not an allowed type. */
export function sniffType(bytes: Uint8Array): AllowedType | null {
  return ALLOWED_TYPES.find((t) => t.matches(bytes)) ?? null;
}

export interface UploadValidation {
  ok: boolean;
  error?: string;
  type?: AllowedType;
}

export function validateUpload(
  filename: string,
  size: number,
  bytes: Uint8Array,
): UploadValidation {
  if (size <= 0) return { ok: false, error: 'The file is empty.' };
  if (size > MAX_UPLOAD_BYTES) {
    return { ok: false, error: 'File is too large (max 10 MB).' };
  }
  const type = sniffType(bytes);
  if (!type) {
    return { ok: false, error: 'Unsupported file type. Allowed: PDF, PNG, JPG, WEBP.' };
  }
  // The declared extension must match the sniffed type (defense in depth).
  const ext = filename.split('.').pop()?.toLowerCase();
  const extOk =
    ext === type.ext || (type.ext === 'jpg' && ext === 'jpeg');
  if (!extOk) {
    return { ok: false, error: 'File extension does not match its contents.' };
  }
  return { ok: true, type };
}
