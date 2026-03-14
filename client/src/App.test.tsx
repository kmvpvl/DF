/// <reference types="vitest/globals" />
import { render, screen } from '@testing-library/react';
import App from './App';
import { I18nProvider } from './i18n/I18nContext';

describe('App', () => {
  const mockFetch = vi.fn();

  beforeEach(() => {
    mockFetch.mockReset();
    vi.stubGlobal('fetch', mockFetch);
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('renders the app brand', () => {
    mockFetch.mockResolvedValue({
      json: async () => ({ data: { sessionUser: null } }),
    });

    render(
      <I18nProvider>
        <App />
      </I18nProvider>
    );
    expect(screen.getAllByText('Dolceforte').length).toBeGreaterThan(0);
  });

  it('auto logs in a user on app visit when server session is valid', async () => {
    mockFetch.mockResolvedValue({
      json: async () => ({
        data: {
          sessionUser: {
            id: '1',
            name: 'Marco',
            fullName: 'Marco Rossi',
            email: 'marco@example.com',
            phone: null,
          },
        },
      }),
    });

    render(
      <I18nProvider>
        <App />
      </I18nProvider>
    );

    expect(await screen.findByText('Hi, Marco')).toBeInTheDocument();
  });

  it('does not auto login when server session is missing or expired', async () => {
    mockFetch.mockResolvedValue({
      json: async () => ({ data: { sessionUser: null } }),
    });

    render(
      <I18nProvider>
        <App />
      </I18nProvider>
    );

    expect((await screen.findAllByText('Dolceforte')).length).toBeGreaterThan(0);
    expect(screen.queryByText('Hi, Marco')).not.toBeInTheDocument();
  });
});
