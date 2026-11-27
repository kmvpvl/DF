/// <reference types="vitest/globals" />
// @vitest-environment jsdom
import '@testing-library/jest-dom/vitest';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import {
  act,
  cleanup,
  fireEvent,
  render,
  within,
} from '@testing-library/react';
import BasketDrawer from './BasketDrawer';
import { OrderStatus } from './sections/Orders';

describe.sequential('BasketDrawer address lookup', () => {
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

    const { container } = render(
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
    const view = within(container);

    const input = view.getByPlaceholderText('Delivery address');
    fireEvent.change(input, { target: { value: 'Bel' } });
    fireEvent.change(input, {
      target: { value: 'Belgrade, Knez Mihailova 1' },
    });
    expect(mockFetch).not.toHaveBeenCalled();

    await act(async () => {
      await vi.advanceTimersByTimeAsync(350);
    });
    expect(mockFetch).toHaveBeenCalledTimes(1);
    expect(view.getByRole('option', { name: address.formatted })).toBeVisible();

    await act(async () => {
      fireEvent.click(view.getByRole('option', { name: address.formatted }));
    });
    expect(mockFetch).toHaveBeenCalledTimes(2);
    expect(view.getByText(/tariff not configured/)).toBeVisible();
    expect(view.getByText('Address selected and verified')).toBeVisible();
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

    const { container } = render(
      <BasketDrawer
        isOpen
        order={{
          id: 'draft-1',
          status: OrderStatus.DRAFT,
          totalPrice: 120,
          products: [{ productId: 'product-1', quantity: 1, price: 120 }],
        }}
        onClose={vi.fn()}
        onIncreaseQty={vi.fn()}
        onDecreaseQty={vi.fn()}
        onRemoveItem={vi.fn()}
        onSubmitOrder={vi.fn()}
        onPushSubscribe={vi.fn()}
        disableConrols={false}
      />
    );
    const view = within(container);

    fireEvent.change(view.getByPlaceholderText('Delivery address'), {
      target: { value: 'Knez Mihailova 1' },
    });
    await act(async () => {
      await vi.advanceTimersByTimeAsync(350);
    });

    expect(mockFetch).toHaveBeenCalledTimes(2);
    expect(view.queryByRole('listbox')).not.toBeInTheDocument();
    expect(view.getByText('Address selected and verified')).toBeVisible();
    expect(view.getByText(/260.00 din/)).toBeVisible();
    expect(view.getByText('Total').parentElement).toHaveTextContent('380.00 -');
  });

  it('prevents placing an order when delivery has no configured tariff', async () => {
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
                  deliveryCost: null,
                  currencySymbol: 'din',
                },
              },
        }),
      };
    });

    const { container } = render(
      <BasketDrawer
        isOpen
        order={{
          id: 'draft-1',
          status: OrderStatus.DRAFT,
          totalPrice: 120,
          products: [{ productId: 'product-1', quantity: 1, price: 120 }],
        }}
        onClose={vi.fn()}
        onIncreaseQty={vi.fn()}
        onDecreaseQty={vi.fn()}
        onRemoveItem={vi.fn()}
        onSubmitOrder={vi.fn()}
        onPushSubscribe={vi.fn()}
        disableConrols={false}
      />
    );
    const view = within(container);

    fireEvent.change(view.getByPlaceholderText('Delivery address'), {
      target: { value: 'Knez Mihailova 1' },
    });
    await act(async () => {
      await vi.advanceTimersByTimeAsync(350);
    });

    expect(view.getByText(/tariff not configured/)).toBeVisible();
    expect(
      view
        .getAllByRole('button', { name: 'Place order' })
        .every((button) => button.hasAttribute('disabled'))
    ).toBe(true);
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

    const { container } = render(
      <BasketDrawer
        isOpen
        user={{
          id: 'user-1',
          name: 'Customer',
          fullName: 'Customer One',
          entityType: 'INDIVIDUAL',
          email: 'customer@example.com',
          phone: '+381601234567',
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
    const view = within(container);

    await act(async () => {
      await Promise.resolve();
      await Promise.resolve();
    });

    expect(mockFetch).toHaveBeenCalledTimes(1);
    expect(JSON.parse(String(mockFetch.mock.calls[0][1].body)).query).toContain(
      'myVerifiedDeliveryAddress'
    );
    expect(view.getByText(/0.00 din/)).toBeVisible();
    expect(view.getByPlaceholderText('Phone')).toHaveValue('+381601234567');
  });

  it('submits pickup without looking up an address or adding a delivery fee', async () => {
    const onSubmitOrder = vi.fn().mockResolvedValue(undefined);
    const { container } = render(
      <BasketDrawer
        isOpen
        companyInfo={{
          id: 'company-1',
          name: 'DolceForte',
          locations: [
            {
              id: 'location-1',
              name: 'Belgrade',
              timezone: 'Europe/Belgrade',
              currencyCode: 'RSD',
              currencySymbol: 'din',
              availablePaymentMethods: ['CASH'],
              availableShippingMethods: ['PICKUP'],
            },
          ],
        }}
        currentLocation="location-1"
        order={{
          id: 'draft-1',
          status: OrderStatus.DRAFT,
          totalPrice: 120,
          products: [{ productId: 'product-1', quantity: 1, price: 120 }],
        }}
        onClose={vi.fn()}
        onIncreaseQty={vi.fn()}
        onDecreaseQty={vi.fn()}
        onRemoveItem={vi.fn()}
        onSubmitOrder={onSubmitOrder}
        onPushSubscribe={vi.fn()}
        disableConrols={false}
      />
    );
    const view = within(container);

    expect(
      view.queryByPlaceholderText('Delivery address')
    ).not.toBeInTheDocument();
    expect(mockFetch).not.toHaveBeenCalled();
    fireEvent.change(view.getByPlaceholderText('Full name'), {
      target: { value: 'Customer One' },
    });
    fireEvent.change(view.getByPlaceholderText('Email'), {
      target: { value: 'customer@example.com' },
    });
    fireEvent.change(view.getByPlaceholderText('Phone'), {
      target: { value: '+381601234567' },
    });
    fireEvent.click(view.getByRole('checkbox'));

    await act(async () => {
      fireEvent.submit(container.querySelector('#basket-order-form')!);
    });

    expect(onSubmitOrder).toHaveBeenCalledWith(
      expect.objectContaining({
        paymentMethod: 'CASH',
        shippingMethod: 'PICKUP',
        customerDeliveryAddress: undefined,
        deliveryLat: undefined,
        deliveryLon: undefined,
      })
    );
    expect(view.getByText('Total').parentElement).toHaveTextContent(
      '120.00 din'
    );
  });

  it('offers deferred bank transfer only to legal entities when configured', () => {
    const props = {
      isOpen: true,
      companyInfo: {
        id: 'company-1',
        name: 'DolceForte',
        locations: [
          {
            id: 'location-1',
            name: 'Belgrade',
            timezone: 'Europe/Belgrade',
            currencyCode: 'RSD',
            currencySymbol: 'din',
            availablePaymentMethods: ['CASH', 'BANK_TRANSFER_7_DAYS'],
            availableShippingMethods: ['PICKUP'],
          },
        ],
      },
      currentLocation: 'location-1',
      order: { status: OrderStatus.DRAFT, products: [] },
      onClose: vi.fn(),
      onIncreaseQty: vi.fn(),
      onDecreaseQty: vi.fn(),
      onRemoveItem: vi.fn(),
      onSubmitOrder: vi.fn(),
      onPushSubscribe: vi.fn(),
      disableConrols: false,
    };

    const { container, rerender } = render(
      <BasketDrawer
        {...props}
        user={{
          id: 'user-1',
          name: 'Customer',
          fullName: 'Customer',
          entityType: 'INDIVIDUAL',
          email: 'customer@example.com',
        }}
      />
    );
    expect(
      within(container).queryByRole('option', {
        name: 'Bank transfer (7 days)',
      })
    ).not.toBeInTheDocument();

    rerender(
      <BasketDrawer
        {...props}
        user={{
          id: 'user-1',
          name: 'Customer',
          fullName: 'Customer',
          entityType: 'LEGAL_ENTITY',
          email: 'customer@example.com',
        }}
      />
    );
    expect(
      within(container).getByRole('option', { name: 'Bank transfer (7 days)' })
    ).toBeInTheDocument();
  });

  it('shows the planned ready date on the place-order button', () => {
    const plannedReady = new Date('2026-11-22T12:30:00.000Z');
    const { container } = render(
      <BasketDrawer
        isOpen
        companyInfo={{
          id: 'company-1',
          name: 'DolceForte',
          locations: [
            {
              id: 'location-1',
              name: 'Belgrade',
              timezone: 'Europe/Belgrade',
              currencyCode: 'RSD',
              currencySymbol: 'din',
              availablePaymentMethods: ['CASH'],
              availableShippingMethods: ['PICKUP'],
            },
          ],
        }}
        currentLocation="location-1"
        order={{
          id: 'draft-1',
          status: OrderStatus.DRAFT,
          orderDateReady: plannedReady,
          totalPrice: 120,
          products: [{ productId: 'product-1', quantity: 2, price: 120 }],
        }}
        onClose={vi.fn()}
        onIncreaseQty={vi.fn()}
        onDecreaseQty={vi.fn()}
        onRemoveItem={vi.fn()}
        onSubmitOrder={vi.fn()}
        onPushSubscribe={vi.fn()}
        disableConrols={false}
      />
    );

    expect(
      within(container).getByRole('button', {
        name: /Place order/,
      })
    ).toBeInTheDocument();
  });
});
