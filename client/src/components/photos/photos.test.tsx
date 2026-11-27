/// <reference types="vitest/globals" />
// @vitest-environment jsdom
import '@testing-library/jest-dom/vitest';
import {
  cleanup,
  fireEvent,
  render,
  screen,
  within,
} from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import Photos from './photos';

afterEach(() => {
  cleanup();
  vi.unstubAllEnvs();
});

describe('Photos client view', () => {
  it('opens the original image in a screen-fitted viewer and closes with Escape', () => {
    vi.stubEnv('VITE_API_BASE_URL', 'https://api.example.test');
    render(
      <Photos
        defaultValue={[
          {
            url: '/uploads/product-original.jpg',
            thumbnailUrl: '/uploads/thumb-product-original.webp',
          },
        ]}
      />
    );

    expect(screen.getByRole('img', { name: 'Product photo 1' })).toHaveAttribute(
      'src',
      'https://api.example.test/uploads/thumb-product-original.webp'
    );

    const zoomButton = screen.getByRole('button', {
      name: 'View full-size image',
    });
    fireEvent.click(zoomButton);

    const dialog = screen.getByRole('dialog', {
      name: 'Full-size product image',
    });
    expect(dialog.parentElement).toBe(document.body);
    expect(
      within(dialog).getByRole('img', { name: 'Product photo 1' })
    ).toHaveAttribute(
      'src',
      'https://api.example.test/uploads/product-original.jpg'
    );

    fireEvent.keyDown(dialog, { key: 'Escape' });

    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    expect(zoomButton).toHaveFocus();
  });
});
