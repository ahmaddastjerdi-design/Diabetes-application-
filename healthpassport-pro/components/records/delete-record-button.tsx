'use client';

import { useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { Trash2 } from 'lucide-react';
import { deleteRecordAction } from '@/lib/actions/records';
import { Button } from '@/components/ui/button';

export function DeleteRecordButton({
  model,
  id,
  label,
}: {
  model: 'condition' | 'medication' | 'allergy' | 'encounter';
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
          await deleteRecordAction(model, id);
          router.refresh();
        })
      }
    >
      <Trash2 aria-hidden />
    </Button>
  );
}
