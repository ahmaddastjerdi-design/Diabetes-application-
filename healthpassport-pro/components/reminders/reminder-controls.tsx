'use client';

import { useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { Loader2, Pause, Play, Trash2 } from 'lucide-react';
import {
  deleteReminderAction,
  toggleReminderAction,
} from '@/lib/actions/reminders';
import { Button } from '@/components/ui/button';

export function ReminderControls({
  id,
  active,
}: {
  id: string;
  active: boolean;
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();

  function toggle() {
    startTransition(async () => {
      await toggleReminderAction(id, !active);
      router.refresh();
    });
  }

  function remove() {
    startTransition(async () => {
      await deleteReminderAction(id);
      router.refresh();
    });
  }

  return (
    <div className="flex items-center gap-1">
      <Button
        type="button"
        variant="ghost"
        size="sm"
        onClick={toggle}
        disabled={pending}
        aria-label={active ? 'Pause reminder' : 'Resume reminder'}
      >
        {pending ? (
          <Loader2 aria-hidden className="animate-spin" />
        ) : active ? (
          <Pause aria-hidden />
        ) : (
          <Play aria-hidden />
        )}
        <span className="text-xs">{active ? 'Pause' : 'Resume'}</span>
      </Button>
      <Button
        type="button"
        variant="ghost"
        size="icon"
        onClick={remove}
        disabled={pending}
        aria-label="Delete reminder"
        className="text-muted-foreground hover:text-destructive"
      >
        <Trash2 aria-hidden />
      </Button>
    </div>
  );
}
