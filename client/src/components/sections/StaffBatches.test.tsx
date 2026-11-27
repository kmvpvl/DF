/// <reference types="vitest/globals" />
// @vitest-environment jsdom
import '@testing-library/jest-dom/vitest';
import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import StaffBatches from './StaffBatches';

afterEach(() => {
  cleanup();
  vi.restoreAllMocks();
  vi.unstubAllGlobals();
  vi.unstubAllEnvs();
});

describe('StaffBatches', () => {
  it('opens an existing batch with its multilingual product name', async () => {
    vi.stubEnv('VITE_API_BASE_URL', 'https://api.example.test');
    vi.spyOn(window, 'scrollTo').mockImplementation(() => {});

    const fetchMock = vi.fn(
      async (_input: RequestInfo | URL, init?: RequestInit) => {
        const request = JSON.parse(String(init?.body)) as { query: string };
        const data = request.query.includes('processMaps(')
          ? {
              processMaps: [
                {
                  id: 'process-map-1',
                  name: 'Standard recipe',
                  rateOfLoss: 0,
                  outcome: 100,
                  parameters: [],
                  ingredients: [],
                },
              ],
            }
          : {
              products: [
                {
                  id: 'product-1',
                  name: { default: 'Cream cake', ts: { ru: 'Сливочный торт' } },
                  batchPrefix: 'CC',
                  variants: [],
                },
              ],
              storageConditions: [{ id: 'storage-1', name: 'Refrigerated' }],
              batches: [
                {
                  id: 'batch-1',
                  number: 12,
                  numberStr: 'CC-12',
                  nettoWeight: 850,
                  storageDurationDays: 5,
                  processDeviations: null,
                  createdAt: '2026-01-01T10:00:00.000Z',
                  updatedAt: '2026-01-01T10:00:00.000Z',
                  product: {
                    id: 'product-1',
                    name: {
                      default: 'Cream cake',
                      ts: { ru: 'Сливочный торт' },
                    },
                    batchPrefix: 'CC',
                  },
                  storageCondition: {
                    id: 'storage-1',
                    name: 'Refrigerated',
                  },
                  processMap: {
                    id: 'process-map-1',
                    name: 'Standard recipe',
                    parameters: [
                      {
                        id: 'parameter-1',
                        name: 'Temperature',
                        value: '4',
                        unit: 'C',
                      },
                    ],
                  },
                },
              ],
              costSettings: { productMainProcessMaps: '{}' },
            };

        return {
          json: async () => ({ data }),
        } as Response;
      }
    );
    vi.stubGlobal('fetch', fetchMock);

    render(<StaffBatches />);
    await screen.findByText('CC-12');
    fireEvent.click(screen.getByRole('button', { name: 'Edit' }));

    expect(await screen.findByText(/Cream cake \(CC\)/)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Update batch' })).toBeVisible();
    expect(screen.getByDisplayValue('850')).toBeInTheDocument();
    expect(screen.getByDisplayValue('5')).toBeInTheDocument();
    await screen.findByRole('option', { name: 'Standard recipe' });
    expect(screen.getAllByRole('combobox')[0]).toHaveValue('process-map-1');
  });
});
