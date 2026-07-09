import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { beforeEach, describe, expect, it } from 'vitest';
import { App } from './App';
import { I18nProvider } from '../i18n/I18nProvider';
import { ThemeProvider } from '../ui/theme';
import { SessionProvider } from '../state/SessionProvider';

function resetDb() {
  return new Promise<void>((resolve) => {
    const req = indexedDB.deleteDatabase('healthpassport');
    req.onsuccess = req.onerror = req.onblocked = () => resolve();
  });
}

beforeEach(async () => {
  await resetDb();
  localStorage.clear();
});

function renderApp() {
  return render(
    <ThemeProvider>
      <I18nProvider>
        <SessionProvider>
          <MemoryRouter initialEntries={['/']}>
            <App />
          </MemoryRouter>
        </SessionProvider>
      </I18nProvider>
    </ThemeProvider>,
  );
}

describe('App gate', () => {
  it('shows onboarding for a first-run (uninitialized) record', async () => {
    renderApp();
    expect(
      await screen.findByText('Welcome to HealthPassport Pro'),
    ).toBeInTheDocument();
  });

  it('completes onboarding and reveals the unlocked app', async () => {
    renderApp();
    await screen.findByText('Welcome to HealthPassport Pro');

    // Acknowledge and continue.
    fireEvent.click(screen.getByRole('checkbox'));
    fireEvent.click(screen.getByRole('button', { name: /get started/i }));

    // Set a strong passphrase.
    const pass = 'Correct-Horse-9';
    fireEvent.change(await screen.findByLabelText('Passphrase'), {
      target: { value: pass },
    });
    fireEvent.change(screen.getByLabelText('Confirm passphrase'), {
      target: { value: pass },
    });
    fireEvent.click(screen.getByRole('button', { name: /create secure record/i }));

    // The unlocked app shows the primary navigation and the disclaimer.
    await waitFor(() =>
      expect(screen.getByRole('link', { name: /record/i })).toBeInTheDocument(),
    );
    expect(screen.getByText(/not medical advice/i)).toBeInTheDocument();
  });
});
