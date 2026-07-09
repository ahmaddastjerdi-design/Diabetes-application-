'use client';

import { useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { Trash2 } from 'lucide-react';
import { deleteDocumentAction } from '@/lib/actions/documents';
import { Button } from '@/components/ui/button';

export function DocumentDeleteButton({ id, label }: { id: string; label: string }) {
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
          await deleteDocumentAction(id);
          router.refresh();
        })
      }
    >
      <Trash2 aria-hidden />
    </Button>
  );
}
