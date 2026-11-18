/// <reference types="vitest/globals" />
// @vitest-environment jsdom
import '@testing-library/jest-dom/vitest';
import { act, cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import Customer from './customer';

describe('Customer order deep link', () => {
  const mockFetch = vi.fn();

  beforeEach(() => {
    mockFetch.mockReset();
    vi.stubGlobal('fetch', mockFetch);
    window.history.replaceState({}, '', '/customer/Orders/order-123');
  });

  afterEach(() => {
    cleanup();
    vi.unstubAllGlobals();
    window.history.replaceState({}, '', '/');
  });

  it('loads and displays order details from the URL object id', async () => {
    mockFetch.mockResolvedValue({
      json: async () => ({
        data: {
          order: {
            id: 'order-123',
            number: '26-1',
            numberInt: 1,
            status: 'CONFIRMED',
            createdAt: '2026-11-18T12:00:00.000Z',
            totalPrice: 1200,
            deliveryAddress: 'Knez Mihailova 1, Belgrade',
            shippingMethod: 'Delivery',
            paymentMethod: 'Cash',
            products: [
              {
                id: 'order-item-1',
                productId: 'product-1',
                quantity: 2,
                price: 1200,
                sortOrder: 0,
                variantLabel: '500g',
                product: {
                  name: 'Tiramisu',
                  variants: [{ label: '500g' }],
                },
              },
            ],
          },
        },
      }),
    });

    render(
      <Customer
        user={{
          id: 'user-1',
          name: 'Customer',
          fullName: 'Customer One',
          entityType: 'INDIVIDUAL',
          email: 'customer@example.com',
        }}
        chapter="Orders"
        objectId="order-123"
        onLoginRequired={vi.fn()}
        onCloseAuth={vi.fn()}
      />
    );

    expect(await screen.findByText('Tiramisu')).toBeVisible();
    expect(screen.getByText('Order #26-1')).toBeVisible();
    expect(screen.getByText('2', { selector: 'strong' })).toBeVisible();
    expect(screen.getByText('Knez Mihailova 1, Belgrade')).toBeVisible();
    expect(mockFetch).toHaveBeenCalledOnce();
    expect(
      JSON.parse(String(mockFetch.mock.calls[0][1].body)).variables.orderId
    ).toBe('order-123');

    await act(async () => {
      fireEvent.click(
        screen.getByRole('button', { name: 'Close order details' })
      );
    });
    expect(window.location.pathname).toBe('/customer/Orders');
    expect(screen.queryByText('Tiramisu')).not.toBeInTheDocument();
  });
});
