import * as React from 'react';
import { cn } from '@/lib/utils/cn';

/** A styled native <select> — simple, accessible, and elderly-friendly. */
const NativeSelect = React.forwardRef<
  HTMLSelectElement,
  React.ComponentProps<'select'>
>(({ className, children, ...props }, ref) => (
  <select
    ref={ref}
    className={cn(
      'flex h-11 w-full rounded-md border border-input bg-background px-3 py-2 text-base shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50 aria-[invalid=true]:border-destructive',
      className,
    )}
    {...props}
  >
    {children}
  </select>
));
NativeSelect.displayName = 'NativeSelect';

export { NativeSelect };
