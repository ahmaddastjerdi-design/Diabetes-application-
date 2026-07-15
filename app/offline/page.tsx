'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { WifiOff } from 'lucide-react';
import { OFFLINE_SUMMARY_KEY } from '@/components/pwa/offline-summary-sync';
import { Brand } from '@/components/layout/brand';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

interface StoredSummary {
  savedAt: string;
  summary: {
    conditions?: Array<{ display: string; status: string }>;
    medications?: Array<{ name: string; dosage?: string }>;
    allergies?: Array<{ substance: string; reaction?: string }>;
    latestVitals?: Array<{ label: string; value: string; recordedAt: string }>;
    latestLabs?: Array<{ label: string; value: string; recordedAt: string }>;
  };
}

function List({ title, items }: { title: string; items: string[] }) {
  if (items.length === 0) return null;
  return (
    <div>
      <h3 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">{title}</h3>
      <ul className="list-disc pl-5 text-sm">
        {items.map((i, idx) => (
          <li key={idx}>{i}</li>
        ))}
      </ul>
    </div>
  );
}

export default function OfflinePage() {
  const [data, setData] = useState<StoredSummary | null | undefined>(undefined);

  useEffect(() => {
    try {
      const raw = localStorage.getItem(OFFLINE_SUMMARY_KEY);
      setData(raw ? (JSON.parse(raw) as StoredSummary) : null);
    } catch {
      setData(null);
    }
  }, []);

  const s = data?.summary;

  return (
    <div className="mx-auto flex min-h-dvh max-w-2xl flex-col gap-6 p-4 pt-8">
      <Brand />
      <div className="flex items-center gap-3 rounded-md bg-muted p-4">
        <WifiOff aria-hidden className="size-5 text-muted-foreground" />
        <p className="text-sm text-muted-foreground">
          You&apos;re offline. {s ? 'Showing your last saved summary.' : 'Reconnect to see your record.'}
        </p>
      </div>

      {s && (
        <Card>
          <CardHeader>
            <CardTitle>Your latest summary</CardTitle>
            {data?.savedAt && (
              <p className="text-sm text-muted-foreground">
                Saved {data.savedAt.slice(0, 10)} · read-only offline copy
              </p>
            )}
          </CardHeader>
          <CardContent className="space-y-4">
            <List title="Conditions" items={(s.conditions ?? []).map((c) => `${c.display} (${c.status.toLowerCase()})`)} />
            <List title="Medications" items={(s.medications ?? []).map((m) => `${m.name}${m.dosage ? ` — ${m.dosage}` : ''}`)} />
            <List title="Allergies" items={(s.allergies ?? []).map((a) => `${a.substance}${a.reaction ? ` — ${a.reaction}` : ''}`)} />
            <List title="Latest vitals" items={(s.latestVitals ?? []).map((v) => `${v.label}: ${v.value} (${v.recordedAt})`)} />
            <List title="Latest labs" items={(s.latestLabs ?? []).map((l) => `${l.label}: ${l.value} (${l.recordedAt})`)} />
            <p className="border-t pt-3 text-xs text-muted-foreground">
              Educational personal health record — not medical advice or a diagnosis.
            </p>
          </CardContent>
        </Card>
      )}

      <Button asChild variant="secondary">
        <Link href="/dashboard">Try again</Link>
      </Button>
    </div>
  );
}
