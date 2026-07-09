import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { describe, expect, it } from 'vitest';
import { App } from './App';
import { I18nProvider } from '../i18n/I18nProvider';
import { ThemeProvider } from '../ui/theme';

function renderApp(initialPath = '/') {
  return render(
    <ThemeProvider>
      <I18nProvider>
        <MemoryRouter initialEntries={[initialPath]}>
          <App />
        </MemoryRouter>
      </I18nProvider>
    </ThemeProvider>,
  );
}

describe('App shell', () => {
  it('renders the brand and primary navigation', () => {
    renderApp('/');
    // Brand appears in the app bar.
    expect(
      screen.getAllByText('HealthPassport Pro').length,
    ).toBeGreaterThan(0);
    // All five primary sections are reachable.
    expect(screen.getByRole('link', { name: /home/i })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /record/i })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /care/i })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /learn/i })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /report/i })).toBeInTheDocument();
  });

  it('always shows the educational disclaimer', () => {
    renderApp('/');
    expect(screen.getByText(/not medical advice/i)).toBeInTheDocument();
  });
});
