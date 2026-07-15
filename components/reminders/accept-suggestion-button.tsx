'use client';

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { Loader2, Plus } from 'lucide-react';
import { acceptSuggestionAction } from '@/lib/actions/reminders';
import { Button } from '@/components/ui/button';

export function AcceptSuggestionButton({ suggestionKey }: { suggestionKey: string }) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string>();

  function add() {
    setError(undefined);
    startTransition(async () => {
      const res = await acceptSuggestionAction(suggestionKey);
      if (res.error) setError(res.error);
      else router.refresh();
    });
  }

  return (
    <div className="flex flex-col items-end gap-1">
      <Button type="button" size="sm" onClick={add} disabled={pending} aria-busy={pending}>
        {pending ? <Loader2 aria-hidden className="animate-spin" /> : <Plus aria-hidden />}
        Add reminder
      </Button>
      {error && <span className="text-xs text-destructive">{error}</span>}
    </div>
  );
}
