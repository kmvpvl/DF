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
  it('uploads every image selected through the file picker', async () => {
    vi.stubEnv('VITE_API_BASE_URL', 'https://api.example.test');
    const onChange = vi.fn();
    const fetchMock = vi.fn(async (_url: string, init: RequestInit) => {
      const file = (init.body as FormData).get('image') as File;
      const filename = file.name.replace(/\.[^.]+$/, '');
      return {
        ok: true,
        json: async () => ({
          url: `/uploads/${filename}.jpg`,
          thumbnailUrl: `/uploads/thumb-${filename}.webp`,
        }),
      };
    });
    vi.stubGlobal('fetch', fetchMock);
    const { container } = render(<Photos editMode onChange={onChange} />);
    const input = container.querySelector('input[type="file"]');
    expect(input).not.toBeNull();

    fireEvent.change(input!, {
      target: {
        files: [
          new File(['first'], 'first.jpg', { type: 'image/jpeg' }),
          new File(['second'], 'second.jpg', { type: 'image/jpeg' }),
        ],
      },
    });

    expect(await screen.findByAltText('Product photo 2')).toBeInTheDocument();
    expect(fetchMock).toHaveBeenCalledTimes(2);
    expect(onChange).toHaveBeenLastCalledWith([
      {
        url: '/uploads/first.jpg',
        thumbnailUrl: '/uploads/thumb-first.webp',
        caption: undefined,
      },
      {
        url: '/uploads/second.jpg',
        thumbnailUrl: '/uploads/thumb-second.webp',
        caption: undefined,
      },
    ]);
  });

  it('reorders photos in edit mode and reports the new value', () => {
    vi.stubEnv('VITE_API_BASE_URL', 'https://api.example.test');
    const onChange = vi.fn();
    render(
      <Photos
        editMode
        onChange={onChange}
        defaultValue={[
          { url: '/uploads/first.jpg' },
          { url: '/uploads/second.jpg' },
        ]}
      />
    );

    fireEvent.click(screen.getByRole('button', { name: 'Move photo 1 right' }));

    expect(onChange).toHaveBeenCalledWith([
      { url: '/uploads/second.jpg' },
      { url: '/uploads/first.jpg' },
    ]);
  });

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
