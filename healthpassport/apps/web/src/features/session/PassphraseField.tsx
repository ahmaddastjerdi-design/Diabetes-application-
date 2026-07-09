import { useState } from 'react';
import { Field, TextInput } from '../../ui/form';

/** Passphrase input with a show/hide toggle. */
export function PassphraseField({
  label,
  value,
  onChange,
  error,
  hint,
  autoComplete = 'current-password',
  autoFocus,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  error?: string;
  hint?: string;
  autoComplete?: 'current-password' | 'new-password';
  autoFocus?: boolean;
}) {
  const [visible, setVisible] = useState(false);
  return (
    <Field label={label} error={error} hint={hint}>
      {({ id, describedBy, invalid }) => (
        <div className="hp-pw-wrap">
          <TextInput
            id={id}
            type={visible ? 'text' : 'password'}
            value={value}
            autoComplete={autoComplete}
            autoFocus={autoFocus}
            aria-invalid={invalid}
            aria-describedby={describedBy}
            onChange={(e) => onChange(e.target.value)}
          />
          <button
            type="button"
            className="hp-pw-toggle"
            onClick={() => setVisible((v) => !v)}
            aria-pressed={visible}
          >
            {visible ? 'Hide' : 'Show'}
          </button>
        </div>
      )}
    </Field>
  );
}
