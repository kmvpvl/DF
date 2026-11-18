/// <reference types="vitest/globals" />
// @vitest-environment jsdom
import '@testing-library/jest-dom/vitest';
import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import StaffOrders from './StaffOrders';

describe('StaffOrders', () => {
  afterEach(() => {
    cleanup();
    vi.unstubAllGlobals();
  });

  it('shows cancellation for completed orders and updates status with notification results', async () => {
    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce({
        json: async () => ({
          data: {
            orders: [
              {
                id: 'order-2',
                number: '1002',
                customerName: 'Test Customer',
                status: 'COMPLETED',
                totalPrice: 40,
                createdAt: '2026-01-01T10:00:00.000Z',
                products: [],
              },
            ],
          },
        }),
      })
      .mockResolvedValueOnce({
        json: async () => ({
          data: {
            cancelOrder: {
              order: { id: 'order-2', status: 'CANCELLED' },
              emailSent: true,
              pushSent: true,
            },
          },
        }),
      });
    vi.stubGlobal('fetch', fetchMock);
    vi.stubGlobal('confirm', vi.fn(() => true));

    render(<StaffOrders />);

    const cancelButton = await screen.findByRole('button', {
      name: 'Cancel order',
    });
    expect(cancelButton).toBeEnabled();
    fireEvent.click(cancelButton);

    await waitFor(() => {
      expect(screen.getByText('CANCELLED')).toBeInTheDocument();
    });
    expect(
      screen.getByText('Order cancelled. Email: sent; Push: sent.')
    ).toBeInTheDocument();
    expect(window.confirm).toHaveBeenCalledOnce();
    expect(fetchMock).toHaveBeenCalledTimes(2);
  });

  it('shows order details and updates status after starting production', async () => {
    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce({
        json: async () => ({
          data: {
            orders: [
              {
                id: 'order-1',
                number: '1001',
                customerName: 'Test Customer',
                customerEmail: 'customer@example.com',
                customerPhone: '+381123456',
                status: 'CONFIRMED',
                totalPrice: 125,
                deliveryFee: 5,
                deliveryAddress: 'Main Street 1',
                deliveryLocation: { lat: 44.8, lon: 20.4 },
                createdAt: '2026-01-01T10:00:00.000Z',
                products: [
                  {
                    id: 'line-1',
                    productId: 'product-1',
                    quantity: 2,
                    price: 120,
                    sortOrder: 0,
                    product: { name: { default: 'Cake', ts: {} } },
                  },
                ],
              },
            ],
          },
        }),
      })
      .mockResolvedValueOnce({
        json: async () => ({
          data: {
            startOrderProduction: {
              order: { id: 'order-1', status: 'IN_PRODUCTION' },
              emailSent: true,
              pushSent: true,
            },
          },
        }),
      });
    vi.stubGlobal('fetch', fetchMock);

    render(<StaffOrders objectId="order-1" />);

    expect(await screen.findByText('Main Street 1')).toBeInTheDocument();
    expect(screen.getByText('customer@example.com')).toHaveAttribute(
      'href',
      'mailto:customer@example.com'
    );
    expect(screen.getByText('Cake')).toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: 'Start production' }));

    await waitFor(() => {
      expect(screen.getByText('IN_PRODUCTION')).toBeInTheDocument();
    });
    expect(
      screen.getByText(
        'Order moved to production. Email: sent; Push: sent.'
      )
    ).toBeInTheDocument();
    expect(fetchMock).toHaveBeenCalledTimes(2);
  });
});
