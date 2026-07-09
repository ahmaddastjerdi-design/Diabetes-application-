import type { ButtonHTMLAttributes, HTMLAttributes, ReactNode } from 'react';
import './primitives.css';

type Variant = 'primary' | 'secondary' | 'ghost' | 'danger';

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant;
  block?: boolean;
}

export function Button({
  variant = 'primary',
  block,
  className = '',
  type = 'button',
  ...rest
}: ButtonProps) {
  const cls = `hp-btn hp-btn--${variant}${block ? ' hp-btn--block' : ''} ${className}`;
  return <button type={type} className={cls.trim()} {...rest} />;
}

export function Card({
  children,
  className = '',
  ...rest
}: HTMLAttributes<HTMLDivElement>) {
  return (
    <div className={`hp-card ${className}`.trim()} {...rest}>
      {children}
    </div>
  );
}

export function Stack({
  children,
  className = '',
  ...rest
}: HTMLAttributes<HTMLDivElement>) {
  return (
    <div className={`hp-stack ${className}`.trim()} {...rest}>
      {children}
    </div>
  );
}

export type Tone = 'ok' | 'caution' | 'alert' | 'info' | 'neutral';

export function Badge({
  tone = 'neutral',
  children,
}: {
  tone?: Tone;
  children: ReactNode;
}) {
  return <span className={`hp-badge hp-badge--${tone}`}>{children}</span>;
}

export function PageHeader({
  title,
  subtitle,
}: {
  title: string;
  subtitle?: string;
}) {
  return (
    <header className="hp-page-header">
      <h1 className="hp-page-header__title">{title}</h1>
      {subtitle && <p className="hp-page-header__subtitle">{subtitle}</p>}
    </header>
  );
}

export function Notice({
  tone = 'info',
  icon,
  children,
  role = 'note',
}: {
  tone?: 'info' | 'caution' | 'alert';
  icon?: ReactNode;
  children: ReactNode;
  role?: HTMLAttributes<HTMLDivElement>['role'];
}) {
  return (
    <div className={`hp-notice hp-notice--${tone}`} role={role}>
      {icon && (
        <span className="hp-notice__icon" aria-hidden="true">
          {icon}
        </span>
      )}
      <div>{children}</div>
    </div>
  );
}

export function EmptyState({ children }: { children: ReactNode }) {
  return <div className="hp-empty">{children}</div>;
}
