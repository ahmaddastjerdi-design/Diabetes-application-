import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { cn } from '@/lib/utils/cn';
import { GLOBAL_DISCLAIMER } from '@/lib/medical-rules/disclaimer';
import { MedicalDisclaimer } from '@/components/safety/medical-disclaimer';
import { StatusBadge } from '@/components/health/status-badge';

describe('cn', () => {
  it('merges and de-duplicates conflicting Tailwind classes', () => {
    expect(cn('p-2', 'p-4')).toBe('p-4');
    expect(cn('text-sm', false, undefined, 'font-bold')).toBe('text-sm font-bold');
  });
});

describe('global disclaimer', () => {
  it('states the non-diagnosis boundary and emergency guidance', () => {
    expect(GLOBAL_DISCLAIMER).toMatch(/does not diagnose, prescribe, or replace/i);
    expect(GLOBAL_DISCLAIMER).toMatch(/emergency medical care/i);
  });

  it('renders the disclaimer text', () => {
    render(<MedicalDisclaimer />);
    expect(screen.getByRole('note')).toHaveTextContent(/personal health record/i);
  });
});

describe('StatusBadge (no color-only status)', () => {
  it('always renders a text label alongside the icon', () => {
    render(<StatusBadge status="alert">High — above target</StatusBadge>);
    expect(screen.getByText('High — above target')).toBeInTheDocument();
  });
});
