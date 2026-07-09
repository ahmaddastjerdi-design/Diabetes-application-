import { Label } from '@/components/ui/label';
import { FieldError } from './form-error';

/** Label + control + hint/error wrapper for React Hook Form fields. */
export function Field({
  id,
  label,
  required,
  hint,
  error,
  children,
}: {
  id: string;
  label: string;
  required?: boolean;
  hint?: string;
  error?: string;
  children: React.ReactNode;
}) {
  const hintId = hint ? `${id}-hint` : undefined;
  const errorId = error ? `${id}-error` : undefined;
  return (
    <div className="space-y-1.5">
      <Label htmlFor={id}>
        {label}
        {required && (
          <span className="text-destructive" aria-hidden>
            {' '}
            *
          </span>
        )}
      </Label>
      {children}
      {hint && (
        <p id={hintId} className="text-xs text-muted-foreground">
          {hint}
        </p>
      )}
      <FieldError id={errorId ?? `${id}-error`} message={error} />
    </div>
  );
}
