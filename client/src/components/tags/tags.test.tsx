/// <reference types="vitest/globals" />
// @vitest-environment jsdom
import '@testing-library/jest-dom/vitest';
import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import Tags from './tags';

describe('Tags edit mode', () => {
  it('adds and removes tags through the multilingual editor', () => {
    const onChange = vi.fn();
    render(
      <Tags
        editMode={true}
        defaultValue={['Small', 'Large']}
        onChange={onChange}
      />
    );

    fireEvent.click(screen.getByRole('button', { name: 'Remove tag 1' }));
    expect(onChange).toHaveBeenLastCalledWith(['Large']);
    expect(screen.getByRole('textbox')).toHaveValue('Large');

    fireEvent.click(screen.getByRole('button', { name: '+ Add tag' }));
    const textboxes = screen.getAllByRole('textbox');
    expect(textboxes).toHaveLength(2);
    expect(textboxes[1]).toHaveValue('');

    fireEvent.change(textboxes[1], { target: { value: 'New tag' } });
    expect(onChange).toHaveBeenLastCalledWith(['Large', 'New tag']);

    fireEvent.click(screen.getByRole('button', { name: 'Remove tag 2' }));
    expect(onChange).toHaveBeenLastCalledWith(['Large']);
  });
});
