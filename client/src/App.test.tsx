/// <reference types="vitest/globals" />
import { fireEvent, render, screen } from '@testing-library/react';
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
    expect(screen.getAllByText('DolceForte').length).toBeGreaterThan(0);
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

    expect((await screen.findAllByText('DolceForte')).length).toBeGreaterThan(
      0
    );
    expect(screen.queryByText('Hi, Marco')).not.toBeInTheDocument();
  });

  it('renders localized price variations for the milk chocolate cheesecake', () => {
    mockFetch.mockResolvedValue({
      json: async () => ({ data: { sessionUser: null } }),
    });

    render(
      <I18nProvider>
        <App />
      </I18nProvider>
    );

    expect(screen.getAllByText('50 din').length).toBeGreaterThan(0);
    expect(screen.getAllByText('60 din').length).toBeGreaterThan(0);
    expect(screen.getAllByText('209 din').length).toBeGreaterThan(0);
  });

  it(
    'updates the add-to-basket price when a cheesecake option is selected',
    () => {
      mockFetch.mockResolvedValue({
        json: async () => ({ data: { sessionUser: null } }),
      });

      render(
        <I18nProvider>
          <App />
        </I18nProvider>
      );

      fireEvent.click(
        screen.getByRole('button', {
          name: 'Select Cube option for Cheesecake glazed in milk chocolate',
        })
      );

      expect(screen.getByTestId('product-price-15')).toHaveTextContent('50 din');

      fireEvent.click(
        screen.getByRole('button', {
          name: 'Select Star option for Cheesecake glazed in milk chocolate',
        })
      );

      expect(screen.getByTestId('product-price-15')).toHaveTextContent('60 din');
    },
    10000
  );

  it('opens profile editing when the logged-in user name is clicked', async () => {
    mockFetch.mockResolvedValue({
      json: async () => ({
        data: {
          sessionUser: {
            id: '1',
            name: 'Marco',
            fullName: 'Marco Rossi',
            entityType: 'INDIVIDUAL',
            email: 'marco@example.com',
            phone: '+381600000000',
            pib: null,
            mbr: null,
            account: null,
            bank: null,
          },
        },
      }),
    });

    render(
      <I18nProvider>
        <App />
      </I18nProvider>
    );

    fireEvent.click(await screen.findByRole('button', { name: 'Hi, Marco' }));

    expect(await screen.findByText('Edit profile')).toBeInTheDocument();
    expect(screen.getByDisplayValue('Marco')).toBeInTheDocument();
    expect(screen.getByDisplayValue('Marco Rossi')).toBeInTheDocument();
  });
});
