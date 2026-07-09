'use client';

import { useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { Trash2 } from 'lucide-react';
import { deleteTrackingAction } from '@/lib/actions/tracking';
import { Button } from '@/components/ui/button';

export function DeleteTrackingButton({
  model,
  id,
  label,
}: {
  model: 'vital' | 'lab' | 'symptom';
  id: string;
  label: string;
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  return (
    <Button
      type="button"
      variant="ghost"
      size="icon"
      aria-label={`Remove ${label}`}
      disabled={pending}
      onClick={() =>
        startTransition(async () => {
          await deleteTrackingAction(model, id);
          router.refresh();
        })
      }
    >
      <Trash2 aria-hidden />
    </Button>
  );
}
