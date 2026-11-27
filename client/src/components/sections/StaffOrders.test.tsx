/// <reference types="vitest/globals" />
// @vitest-environment jsdom
import '@testing-library/jest-dom/vitest';
import {
  cleanup,
  fireEvent,
  render,
  screen,
  waitFor,
} from '@testing-library/react';
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
    vi.stubGlobal(
      'confirm',
      vi.fn(() => true)
    );

    render(<StaffOrders />);

    fireEvent.change(screen.getByRole('combobox', { name: 'Status' }), {
      target: { value: 'ALL' },
    });
    fireEvent.change(screen.getByLabelText('Created from'), {
      target: { value: '' },
    });
    fireEvent.change(screen.getByLabelText('Created to'), {
      target: { value: '' },
    });
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

  it('filters active orders by default and supports date, name, and phone filters', async () => {
    const now = new Date();
    const recentDate = now.toISOString();
    const oldDate = new Date(now);
    oldDate.setDate(oldDate.getDate() - 14);
    const fetchMock = vi.fn().mockResolvedValueOnce({
      json: async () => ({
        data: {
          orders: [
            {
              id: 'recent',
              number: '2001',
              customerName: 'Alice Example',
              customerPhone: '+381111111',
              status: 'CONFIRMED',
              totalPrice: 40,
              createdAt: recentDate,
              products: [],
            },
            {
              id: 'old',
              number: '2002',
              customerName: 'Bob Example',
              customerPhone: '+381222222',
              status: 'CONFIRMED',
              totalPrice: 50,
              createdAt: oldDate.toISOString(),
              products: [],
            },
            {
              id: 'completed',
              number: '2003',
              customerName: 'Completed Customer',
              customerPhone: '+381333333',
              status: 'COMPLETED',
              totalPrice: 60,
              createdAt: recentDate,
              products: [],
            },
          ],
        },
      }),
    });
    vi.stubGlobal('fetch', fetchMock);

    render(<StaffOrders />);

    expect(await screen.findByText('Alice Example')).toBeInTheDocument();
    expect(screen.queryByText('Bob Example')).not.toBeInTheDocument();
    expect(screen.queryByText('Completed Customer')).not.toBeInTheDocument();
    expect(screen.getByRole('combobox', { name: 'Status' })).toHaveValue(
      'ACTIVE'
    );

    const expectedFrom = new Date();
    expectedFrom.setDate(expectedFrom.getDate() - 6);
    const fromValue = [
      expectedFrom.getFullYear(),
      String(expectedFrom.getMonth() + 1).padStart(2, '0'),
      String(expectedFrom.getDate()).padStart(2, '0'),
    ].join('-');
    expect(screen.getByLabelText('Created from')).toHaveValue(fromValue);

    fireEvent.change(screen.getByLabelText('Customer name'), {
      target: { value: 'Alice' },
    });
    fireEvent.change(screen.getByLabelText('Customer phone'), {
      target: { value: '111111' },
    });
    expect(screen.getByText('Alice Example')).toBeInTheDocument();
    expect(
      screen.queryByText('No orders match the selected filters.')
    ).not.toBeInTheDocument();
    const orderRow = screen.getByText('2001').closest('tr');
    expect(orderRow).not.toBeNull();
    fireEvent.click(orderRow!);
    expect(screen.getByText('Customer note')).toBeInTheDocument();
    fireEvent.click(orderRow!);
    expect(screen.queryByText('Customer note')).not.toBeInTheDocument();

    fireEvent.change(screen.getByLabelText('Customer phone'), {
      target: { value: '999999' },
    });
    expect(
      screen.getByText('No orders match the selected filters.')
    ).toBeInTheDocument();
  });

  it('marks an in-production order ready and shows customer notification results', async () => {
    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce({
        json: async () => ({
          data: {
            orders: [
              {
                id: 'order-ready',
                number: '1003',
                customerName: 'Test Customer',
                status: 'IN_PRODUCTION',
                totalPrice: 40,
                createdAt: new Date().toISOString(),
                products: [],
              },
            ],
          },
        }),
      })
      .mockResolvedValueOnce({
        json: async () => ({
          data: {
            markOrderReady: {
              order: { id: 'order-ready', status: 'READY' },
              emailSent: true,
              pushSent: true,
            },
          },
        }),
      });
    vi.stubGlobal('fetch', fetchMock);

    render(<StaffOrders />);
    fireEvent.click(
      await screen.findByRole('button', { name: 'Mark as ready' })
    );

    await waitFor(() => {
      expect(screen.getByText('READY')).toBeInTheDocument();
    });
    expect(
      screen.getByText('Order marked ready. Email: sent; Push: sent.')
    ).toBeInTheDocument();
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
                createdAt: new Date().toISOString(),
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
      screen.getByText('Order moved to production. Email: sent; Push: sent.')
    ).toBeInTheDocument();
    expect(fetchMock).toHaveBeenCalledTimes(2);
  });
});
