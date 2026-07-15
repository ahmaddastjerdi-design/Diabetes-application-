import { AlertTriangle, CheckCircle2, CircleAlert, Info } from 'lucide-react';
import { cn } from '@/lib/utils/cn';

export type HealthStatus = 'ok' | 'caution' | 'alert' | 'neutral';

const CONFIG: Record<
  HealthStatus,
  { icon: typeof Info; className: string }
> = {
  ok: { icon: CheckCircle2, className: 'bg-success/15 text-success' },
  caution: { icon: AlertTriangle, className: 'bg-warning/15 text-warning' },
  alert: { icon: CircleAlert, className: 'bg-destructive/15 text-destructive' },
  neutral: { icon: Info, className: 'bg-muted text-muted-foreground' },
};

/**
 * A medical status pill. Accessibility rule: status is conveyed by icon + text,
 * never color alone (docs/ACCESSIBILITY_CHECKLIST.md §4).
 */
export function StatusBadge({
  status,
  children,
  className,
}: {
  status: HealthStatus;
  children: React.ReactNode;
  className?: string;
}) {
  const { icon: Icon, className: tone } = CONFIG[status];
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-semibold',
        tone,
        className,
      )}
    >
      <Icon aria-hidden className="size-3.5" />
      {children}
    </span>
  );
}
