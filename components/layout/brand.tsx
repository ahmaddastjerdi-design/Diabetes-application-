import Link from 'next/link';
import { HeartPulse } from 'lucide-react';
import { cn } from '@/lib/utils/cn';

/** Product wordmark + logo. */
export function Brand({
  href = '/',
  className,
}: {
  href?: string;
  className?: string;
}) {
  return (
    <Link
      href={href}
      className={cn('inline-flex items-center gap-2 font-bold', className)}
    >
      <span className="grid size-8 place-items-center rounded-lg bg-primary text-primary-foreground">
        <HeartPulse aria-hidden className="size-5" />
      </span>
      <span>HealthPassport&nbsp;Pro</span>
    </Link>
  );
}
