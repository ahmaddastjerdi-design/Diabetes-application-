import { Info } from 'lucide-react';
import { GLOBAL_DISCLAIMER } from '@/lib/medical-rules/disclaimer';
import { cn } from '@/lib/utils/cn';

/** The standing educational disclaimer. `variant="compact"` for footers. */
export function MedicalDisclaimer({
  variant = 'full',
  className,
}: {
  variant?: 'full' | 'compact';
  className?: string;
}) {
  return (
    <div
      role="note"
      className={cn(
        'flex gap-3 rounded-md bg-muted p-4 text-sm text-muted-foreground',
        variant === 'compact' && 'p-3 text-xs',
        className,
      )}
    >
      <Info aria-hidden className="mt-0.5 shrink-0 text-primary" />
      <p>{GLOBAL_DISCLAIMER}</p>
    </div>
  );
}
