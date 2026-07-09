'use client';

import { useState, useTransition } from 'react';
import { Loader2, TriangleAlert } from 'lucide-react';
import { deleteAccountAction } from '@/lib/actions/account';
import { FormError } from '@/components/forms/form-error';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';

export function DeleteAccount() {
  const [open, setOpen] = useState(false);
  const [confirm, setConfirm] = useState('');
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string>();

  function onDelete() {
    setError(undefined);
    startTransition(async () => {
      // On success the action signs out and redirects (throws a redirect),
      // so control only returns here on error.
      const res = await deleteAccountAction(confirm);
      if (res?.error) setError(res.error);
    });
  }

  if (!open) {
    return (
      <Button variant="destructive" type="button" onClick={() => setOpen(true)}>
        <TriangleAlert aria-hidden /> Delete my account
      </Button>
    );
  }

  return (
    <div className="space-y-3 rounded-md border border-destructive/50 bg-destructive/5 p-4">
      <p className="text-sm font-medium text-destructive">
        This permanently erases your account and all health records. It cannot be undone.
      </p>
      <FormError message={error} />
      <div className="space-y-1.5">
        <Label htmlFor="del-confirm">
          Type <span className="font-mono font-bold">DELETE</span> to confirm
        </Label>
        <Input
          id="del-confirm"
          value={confirm}
          autoComplete="off"
          onChange={(e) => setConfirm(e.target.value)}
        />
      </div>
      <div className="flex gap-2">
        <Button
          variant="destructive"
          type="button"
          onClick={onDelete}
          disabled={pending || confirm !== 'DELETE'}
          aria-busy={pending}
        >
          {pending && <Loader2 aria-hidden className="animate-spin" />}
          Permanently delete
        </Button>
        <Button variant="ghost" type="button" onClick={() => setOpen(false)} disabled={pending}>
          Cancel
        </Button>
      </div>
    </div>
  );
}
