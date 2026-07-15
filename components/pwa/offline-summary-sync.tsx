'use client';

import { useEffect } from 'react';

export const OFFLINE_SUMMARY_KEY = 'hp.offlineSummary';

/**
 * Keeps a limited offline copy of the latest health summary in local storage —
 * ONLY when the patient has granted OFFLINE_SUMMARY consent. When consent is
 * off, any stored copy is removed (docs/PRIVACY_MODEL.md §3).
 */
export function OfflineSummarySync({ consented }: { consented: boolean }) {
  useEffect(() => {
    if (!consented) {
      try {
        localStorage.removeItem(OFFLINE_SUMMARY_KEY);
      } catch {
        /* storage unavailable — nothing to clear */
      }
      return;
    }
    let cancelled = false;
    fetch('/api/export?format=summary')
      .then((r) => (r.ok ? r.json() : null))
      .then((summary) => {
        if (cancelled || !summary) return;
        try {
          localStorage.setItem(
            OFFLINE_SUMMARY_KEY,
            JSON.stringify({ savedAt: new Date().toISOString(), summary }),
          );
        } catch {
          /* quota / private mode — offline summary simply unavailable */
        }
      })
      .catch(() => {});
    return () => {
      cancelled = true;
    };
  }, [consented]);
  return null;
}
