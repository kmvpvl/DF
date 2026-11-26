import './ProductVariantEditor.css';
import { Component } from 'react';
import { IDiscountTier, IPriceDetail, IProductVariant } from '@betypes/product';
import MLStringEditor from '../mlstring/mlstring';
import { ILocation } from '@betypes/company';

interface IProductVariantEditorProps {
  variant: IProductVariant;
  locations: ILocation[];
  onChange: (variant: IProductVariant) => void;
  onRemove: () => void;
}

export default class ProductVariantEditor extends Component<IProductVariantEditorProps> {
  private update = (field: keyof IProductVariant, value: any) => {
    this.props.onChange({ ...this.props.variant, [field]: value });
  };

  private updatePrice = (
    locationId: string,
    updates: Partial<IPriceDetail>
  ) => {
    const locationPrices = this.props.variant.locationPrices ?? [];
    const hasLocationPrice = locationPrices.some(
      (locationPrice) => locationPrice.locationId === locationId
    );
    const newPrice = hasLocationPrice
      ? locationPrices.map((locationPrice) =>
          locationPrice.locationId === locationId
            ? { ...locationPrice, ...updates }
            : locationPrice
        )
      : [...locationPrices, { locationId, individualPrice: 0, ...updates }];
    this.props.onChange({
      ...this.props.variant,
      locationPrices: newPrice,
    });
  };

  private updateDiscountTier = (
    locationId: string,
    customerType: 'individual' | 'legal',
    tierIndex: number,
    updates: Partial<IDiscountTier>
  ) => {
    const locationPrice = this.props.variant.locationPrices?.find(
      (price) => price.locationId === locationId
    );
    const discounts =
      customerType === 'individual'
        ? (locationPrice?.individualDiscounts ?? [])
        : (locationPrice?.legalDiscounts ?? []);
    const updatedDiscounts = discounts.map((tier, index) =>
      index === tierIndex ? { ...tier, ...updates } : tier
    );

    this.updatePrice(
      locationId,
      customerType === 'individual'
        ? { individualDiscounts: updatedDiscounts }
        : { legalDiscounts: updatedDiscounts }
    );
  };

  private addDiscountTier = (
    locationId: string,
    customerType: 'individual' | 'legal'
  ) => {
    const locationPrice = this.props.variant.locationPrices?.find(
      (price) => price.locationId === locationId
    );
    const discounts =
      customerType === 'individual'
        ? (locationPrice?.individualDiscounts ?? [])
        : (locationPrice?.legalDiscounts ?? []);
    const nextThreshold =
      discounts.reduce((max, tier) => Math.max(max, tier.threshold), 1) + 1;
    const newDiscounts = [
      ...discounts,
      { threshold: nextThreshold, discount: 0 },
    ];

    this.updatePrice(
      locationId,
      customerType === 'individual'
        ? { individualDiscounts: newDiscounts }
        : { legalDiscounts: newDiscounts }
    );
  };

  private removeDiscountTier = (
    locationId: string,
    customerType: 'individual' | 'legal',
    tierIndex: number
  ) => {
    const locationPrice = this.props.variant.locationPrices?.find(
      (price) => price.locationId === locationId
    );
    const discounts =
      customerType === 'individual'
        ? (locationPrice?.individualDiscounts ?? [])
        : (locationPrice?.legalDiscounts ?? []);
    const newDiscounts = discounts.filter((_, index) => index !== tierIndex);

    this.updatePrice(
      locationId,
      customerType === 'individual'
        ? { individualDiscounts: newDiscounts }
        : { legalDiscounts: newDiscounts }
    );
  };

  private renderDiscountEditor(
    locationId: string,
    customerType: 'individual' | 'legal',
    title: string,
    discounts: IDiscountTier[]
  ) {
    return (
      <div className="product-variant-discount-editor">
        <div className="product-variant-discount-header">
          <strong>{title}</strong>
          <button
            type="button"
            className="cj-btn-sm"
            onClick={() => this.addDiscountTier(locationId, customerType)}
          >
            + Add tier
          </button>
        </div>
        {discounts.length === 0 ? (
          <p className="product-variant-discount-empty">No discount tiers</p>
        ) : (
          <div className="product-variant-discount-tiers">
            {discounts.map((tier, index) => (
              <div
                className="product-variant-discount-tier"
                key={`${locationId}-${customerType}-${index}`}
              >
                <label className="cj-label">
                  Quantity from
                  <input
                    type="number"
                    className="cj-input material-input"
                    aria-label={`Quantity from for ${title} tier ${index + 1}`}
                    min="0.01"
                    step="any"
                    value={tier.threshold}
                    onChange={(event) =>
                      this.updateDiscountTier(locationId, customerType, index, {
                        threshold: Number(event.target.value),
                      })
                    }
                  />
                </label>
                <label className="cj-label">
                  Discount (%)
                  <input
                    type="number"
                    className="cj-input material-input"
                    aria-label={`Discount percent for ${title} tier ${index + 1}`}
                    min="0"
                    max="100"
                    step="any"
                    value={tier.discount}
                    onChange={(event) =>
                      this.updateDiscountTier(locationId, customerType, index, {
                        discount: Number(event.target.value),
                      })
                    }
                  />
                </label>
                <button
                  type="button"
                  className="cj-btn-sm product-variant-discount-remove"
                  aria-label={`Remove ${title} tier ${index + 1}`}
                  onClick={() =>
                    this.removeDiscountTier(locationId, customerType, index)
                  }
                >
                  Remove
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    );
  }

  render() {
    const { variant, onRemove } = this.props;
    return (
      <div className="product-variant-editor-container">
        <div className="product-variant-editor-fields-2">
          <MLStringEditor
            caption="Variant Label"
            defaultValue={variant.label}
            onChange={(val) => this.update('label', val)}
          />
          <label className="cj-label">
            Weight
            <div style={{ display: 'flex', gap: '5px' }}>
              <input
                type="number"
                className="cj-input material-input"
                value={variant.weight}
                onChange={(e) => this.update('weight', Number(e.target.value))}
              />
              <input
                type="text"
                className="cj-input material-input"
                style={{ width: '60px' }}
                value={variant.weightUnit}
                onChange={(e) => this.update('weightUnit', e.target.value)}
              />
            </div>
          </label>
        </div>
        <div className="product-variant-editor-fields-2 product-variant-editor-prices">
          <div>
            {this.props.locations.map((location) => {
              const lPrice = variant.locationPrices?.find(
                (locationPrice) => locationPrice.locationId === location.id
              );
              return (
                <div
                  className="product-variant-editor-price-row"
                  key={location.id}
                >
                  <span className="product-variant-location-name">
                    Location: {location.name}
                  </span>
                  <label className="cj-label">
                    Individual Price
                    <input
                      type="number"
                      className="cj-input material-input"
                      value={lPrice?.individualPrice ?? ''}
                      onChange={(e) =>
                        this.updatePrice(location.id, {
                          individualPrice: Number(e.target.value),
                        })
                      }
                    />
                  </label>
                  <label className="cj-label">
                    Legal Entity Price
                    <input
                      type="number"
                      className="cj-input material-input"
                      value={lPrice?.legalEntityPrice ?? ''}
                      onChange={(e) =>
                        this.updatePrice(location.id, {
                          legalEntityPrice: e.target.value
                            ? Number(e.target.value)
                            : undefined,
                        })
                      }
                    />
                  </label>
                  {this.renderDiscountEditor(
                    location.id,
                    'individual',
                    'Individual customer discounts',
                    lPrice?.individualDiscounts ?? []
                  )}
                  {this.renderDiscountEditor(
                    location.id,
                    'legal',
                    'Legal entity discounts',
                    lPrice?.legalDiscounts ?? []
                  )}
                </div>
              );
            })}
          </div>
        </div>

        <button
          type="button"
          className="cj-btn-sm"
          style={{ marginTop: '8px', color: '#d9534f' }}
          onClick={onRemove}
        >
          Remove variant
        </button>
      </div>
    );
  }
}
