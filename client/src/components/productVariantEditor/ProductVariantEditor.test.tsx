/// <reference types="vitest/globals" />
// @vitest-environment jsdom
import '@testing-library/jest-dom/vitest';
import { fireEvent, render, screen, within } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { IProductVariant } from '@betypes/product';
import { ILocation } from '@betypes/company';
import ProductVariantEditor from './ProductVariantEditor';

const locations: ILocation[] = [
  {
    id: 'location-a',
    name: 'Pančevo',
    timezone: 'Europe/Belgrade',
    currencyCode: 'RSD',
    currencySymbol: 'din',
  },
  {
    id: 'location-b',
    name: 'Belgrade',
    timezone: 'Europe/Belgrade',
    currencyCode: 'RSD',
    currencySymbol: 'din',
  },
];

const variant: IProductVariant = {
  label: 'Small',
  weight: 100,
  weightUnit: 'g',
  isWeightBased: false,
  locationPrices: [
    {
      locationId: 'location-a',
      individualPrice: 100,
      legalEntityPrice: 90,
      individualDiscounts: [{ threshold: 2, discount: 5 }],
      legalDiscounts: [{ threshold: 3, discount: 10 }],
    },
    {
      locationId: 'location-b',
      individualPrice: 120,
      individualDiscounts: [{ threshold: 4, discount: 7 }],
      legalDiscounts: [],
    },
  ],
};

describe('ProductVariantEditor discounts', () => {
  it('edits independent discount tiers per location and customer type', () => {
    const onChange = vi.fn();
    render(
      <ProductVariantEditor
        variant={variant}
        locations={locations}
        onChange={onChange}
        onRemove={vi.fn()}
      />
    );

    const individualEditor = screen
      .getAllByText('Individual customer discounts')[0]
      .closest('.product-variant-discount-editor');
    expect(individualEditor).not.toBeNull();
    fireEvent.click(
      within(individualEditor as HTMLElement).getByRole('button', {
        name: '+ Add tier',
      })
    );

    let updated = onChange.mock.calls[0][0] as IProductVariant;
    expect(updated.locationPrices[0].individualDiscounts).toEqual([
      { threshold: 2, discount: 5 },
      { threshold: 3, discount: 0 },
    ]);
    expect(updated.locationPrices[0].legalDiscounts).toEqual([
      { threshold: 3, discount: 10 },
    ]);
    expect(updated.locationPrices[1].individualDiscounts).toEqual([
      { threshold: 4, discount: 7 },
    ]);

    const legalEditor = screen
      .getAllByText('Legal entity discounts')[0]
      .closest('.product-variant-discount-editor');
    expect(legalEditor).not.toBeNull();
    fireEvent.change(
      within(legalEditor as HTMLElement).getByLabelText(
        'Discount percent for Legal entity discounts tier 1'
      ),
      { target: { value: '15' } }
    );
    updated = onChange.mock.calls[1][0] as IProductVariant;
    expect(updated.locationPrices[0].legalDiscounts).toEqual([
      { threshold: 3, discount: 15 },
    ]);
    expect(updated.locationPrices[0].individualDiscounts).toEqual([
      { threshold: 2, discount: 5 },
    ]);

    fireEvent.click(
      within(legalEditor as HTMLElement).getByRole('button', {
        name: 'Remove Legal entity discounts tier 1',
      })
    );
    updated = onChange.mock.calls[2][0] as IProductVariant;
    expect(updated.locationPrices[0].legalDiscounts).toEqual([]);
    expect(updated.locationPrices[0].individualDiscounts).toEqual([
      { threshold: 2, discount: 5 },
    ]);
  });
});
