/// <reference types="vitest/globals" />
// @vitest-environment jsdom
import '@testing-library/jest-dom/vitest';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import {
  act,
  cleanup,
  fireEvent,
  render,
  screen,
} from '@testing-library/react';
import BasketDrawer from './BasketDrawer';
import { OrderStatus } from './sections/Orders';

describe('BasketDrawer address lookup', () => {
  const mockFetch = vi.fn();

  beforeEach(() => {
    mockFetch.mockReset();
    vi.stubGlobal('fetch', mockFetch);
    vi.useFakeTimers();
  });

  afterEach(() => {
    cleanup();
    vi.useRealTimers();
    vi.unstubAllGlobals();
  });

  it('debounces address search and calculates a route only after selecting an exact address', async () => {
    const address = {
      formatted: 'Knez Mihailova 1, Belgrade',
      lat: 44.8176,
      lon: 20.4569,
      isExactHouse: true,
    };
    const secondAddress = {
      formatted: 'Kralja Petra 4, Belgrade',
      lat: 44.819,
      lon: 20.46,
      isExactHouse: true,
    };
    mockFetch.mockImplementation(async (_url: string, init: RequestInit) => {
      const request = JSON.parse(String(init.body)) as { query: string };
      return {
        json: async () => ({
          data: request.query.includes('SearchAddress')
            ? { searchAddress: [address, secondAddress] }
            : request.query.includes('VerifyDeliveryAddress')
              ? {
                  verifyDeliveryAddress: {
                    distanceMeters: 1200,
                    durationSeconds: 300,
                    isValidAddress: true,
                    deliveryCost: null,
                    currencySymbol: 'din',
                  },
                }
              : {
                  estimateDelivery: {
                    distanceMeters: 1200,
                    durationSeconds: 300,
                    isValidAddress: true,
                    deliveryCost: null,
                    currencySymbol: 'din',
                  },
                },
        }),
      };
    });

    render(
      <BasketDrawer
        isOpen
        order={{ status: OrderStatus.DRAFT, products: [] }}
        onClose={vi.fn()}
        onIncreaseQty={vi.fn()}
        onDecreaseQty={vi.fn()}
        onRemoveItem={vi.fn()}
        onSubmitOrder={vi.fn()}
        onPushSubscribe={vi.fn()}
        disableConrols={false}
      />
    );

    const input = screen.getByPlaceholderText('Delivery address');
    fireEvent.change(input, { target: { value: 'Bel' } });
    fireEvent.change(input, {
      target: { value: 'Belgrade, Knez Mihailova 1' },
    });
    expect(mockFetch).not.toHaveBeenCalled();

    await act(async () => {
      await vi.advanceTimersByTimeAsync(350);
    });
    expect(mockFetch).toHaveBeenCalledTimes(1);
    expect(
      screen.getByRole('option', { name: address.formatted })
    ).toBeVisible();

    await act(async () => {
      fireEvent.click(screen.getByRole('option', { name: address.formatted }));
    });
    expect(mockFetch).toHaveBeenCalledTimes(2);
    expect(screen.getByText(/tariff not configured/)).toBeVisible();
    expect(screen.getByText('Address selected and verified')).toBeVisible();
  });

  it('automatically selects the only exact address suggestion', async () => {
    mockFetch.mockImplementation(async (_url: string, init: RequestInit) => {
      const request = JSON.parse(String(init.body)) as { query: string };
      return {
        json: async () => ({
          data: request.query.includes('SearchAddress')
            ? {
                searchAddress: [
                  {
                    formatted: 'Knez Mihailova 1, Belgrade',
                    lat: 44.8176,
                    lon: 20.4569,
                    isExactHouse: true,
                  },
                ],
              }
            : {
                verifyDeliveryAddress: {
                  distanceMeters: 1200,
                  durationSeconds: 300,
                  isValidAddress: true,
                  deliveryCost: 260,
                  currencySymbol: 'din',
                },
              },
        }),
      };
    });

    render(
      <BasketDrawer
        isOpen
        order={{ status: OrderStatus.DRAFT, products: [] }}
        onClose={vi.fn()}
        onIncreaseQty={vi.fn()}
        onDecreaseQty={vi.fn()}
        onRemoveItem={vi.fn()}
        onSubmitOrder={vi.fn()}
        onPushSubscribe={vi.fn()}
        disableConrols={false}
      />
    );

    fireEvent.change(screen.getByPlaceholderText('Delivery address'), {
      target: { value: 'Knez Mihailova 1' },
    });
    await act(async () => {
      await vi.advanceTimersByTimeAsync(350);
    });

    expect(mockFetch).toHaveBeenCalledTimes(2);
    expect(screen.queryByRole('listbox')).not.toBeInTheDocument();
    expect(screen.getByText('Address selected and verified')).toBeVisible();
    expect(screen.getByText(/260.00 din/)).toBeVisible();
  });

  it('reuses the verified address and saved route for the next order', async () => {
    mockFetch.mockImplementation(async () => ({
      json: async () => ({
        data: {
          myVerifiedDeliveryAddress: {
            address: 'Knez Mihailova 1, Belgrade',
            lat: 44.8176,
            lon: 20.4569,
            distanceMeters: 1200,
            durationSeconds: 300,
            isValidAddress: true,
            deliveryCost: 0,
            currencySymbol: 'din',
          },
        },
      }),
    }));

    render(
      <BasketDrawer
        isOpen
        user={{
          id: 'user-1',
          name: 'Customer',
          fullName: 'Customer One',
          entityType: 'INDIVIDUAL',
          email: 'customer@example.com',
          deliveryAddress: 'Knez Mihailova 1, Belgrade',
        }}
        order={{ status: OrderStatus.DRAFT, products: [] }}
        onClose={vi.fn()}
        onIncreaseQty={vi.fn()}
        onDecreaseQty={vi.fn()}
        onRemoveItem={vi.fn()}
        onSubmitOrder={vi.fn()}
        onPushSubscribe={vi.fn()}
        disableConrols={false}
      />
    );

    await act(async () => {
      await Promise.resolve();
      await Promise.resolve();
    });

    expect(mockFetch).toHaveBeenCalledTimes(1);
    expect(JSON.parse(String(mockFetch.mock.calls[0][1].body)).query).toContain(
      'myVerifiedDeliveryAddress'
    );
    expect(screen.getByText(/0.00 din/)).toBeVisible();
  });
});
