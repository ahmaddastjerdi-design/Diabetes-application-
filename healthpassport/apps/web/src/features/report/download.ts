/** Trigger a client-side file download from in-memory data (no network). */
function triggerDownload(blob: Blob, filename: string): void {
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}

export function downloadJson(filename: string, data: unknown): void {
  triggerDownload(
    new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' }),
    filename,
  );
}

/** A filesystem-safe timestamp suffix, e.g. 2026-07-09. */
export function dateStamp(iso: string): string {
  return iso.slice(0, 10);
}
