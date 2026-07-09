'use client';

import { useState, useTransition } from 'react';
import { setOfflineConsentAction } from '@/lib/actions/profile';
import { Button } from '@/components/ui/button';

export function OfflineConsentToggle({ initial }: { initial: boolean }) {
  const [granted, setGranted] = useState(initial);
  const [pending, startTransition] = useTransition();

  function toggle() {
    const next = !granted;
    startTransition(async () => {
      await setOfflineConsentAction(next);
      setGranted(next);
    });
  }

  return (
    <div className="flex items-center justify-between gap-4 rounded-md border p-4">
      <div>
        <p className="font-medium">Offline health summary</p>
        <p className="text-sm text-muted-foreground">
          {granted
            ? 'A copy of your latest summary can be shown on this device when offline.'
            : 'Keep a copy of your latest summary on this device for offline access.'}
        </p>
      </div>
      <Button
        type="button"
        variant={granted ? 'secondary' : 'default'}
        onClick={toggle}
        disabled={pending}
        aria-pressed={granted}
      >
        {granted ? 'Turn off' : 'Turn on'}
      </Button>
    </div>
  );
}
