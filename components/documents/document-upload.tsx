'use client';

import { useRef, useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { Loader2, Upload } from 'lucide-react';
import { Field } from '@/components/forms/field';
import { FormError } from '@/components/forms/form-error';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';

const ACCEPT = '.pdf,.png,.jpg,.jpeg,.webp';

export function DocumentUpload() {
  const router = useRouter();
  const fileRef = useRef<HTMLInputElement>(null);
  const [title, setTitle] = useState('');
  const [error, setError] = useState<string>();
  const [pending, startTransition] = useTransition();

  function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(undefined);
    const file = fileRef.current?.files?.[0];
    if (!file) {
      setError('Choose a file to upload.');
      return;
    }
    const body = new FormData();
    body.set('file', file);
    if (title.trim()) body.set('title', title.trim());

    startTransition(async () => {
      const res = await fetch('/api/upload', { method: 'POST', body });
      const data = (await res.json().catch(() => ({}))) as { error?: string };
      if (!res.ok) {
        setError(data.error ?? 'Upload failed.');
        return;
      }
      setTitle('');
      if (fileRef.current) fileRef.current.value = '';
      router.refresh();
    });
  }

  return (
    <form onSubmit={onSubmit} className="space-y-3">
      <FormError message={error} />
      <Field id="doc-title" label="Title (optional)">
        <Input
          id="doc-title"
          value={title}
          placeholder="e.g. Lab report — June"
          onChange={(e) => setTitle(e.target.value)}
        />
      </Field>
      <Field id="doc-file" label="File" hint="PDF, PNG, JPG, or WEBP · up to 10 MB">
        <Input id="doc-file" ref={fileRef} type="file" accept={ACCEPT} required />
      </Field>
      <div className="flex justify-end">
        <Button type="submit" disabled={pending} aria-busy={pending}>
          {pending ? <Loader2 aria-hidden className="animate-spin" /> : <Upload aria-hidden />}
          Upload
        </Button>
      </div>
    </form>
  );
}
