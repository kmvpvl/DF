import { Component } from 'react';
import { IProductVariant } from '@betypes/product';
import MLStringEditor from '../mlstring/mlstring';
import { Location } from '@betypes/location';

interface IProductVariantEditorProps {
  variant: IProductVariant;
  locations: Location[];
  onChange: (variant: IProductVariant) => void;
  onRemove: () => void;
}

export default class ProductVariantEditor extends Component<IProductVariantEditorProps> {
  private update = (field: keyof IProductVariant, value: any) => {
    this.props.onChange({ ...this.props.variant, [field]: value });
  };

  private updatePrice = (
    field: keyof (typeof this.props.variant.locationPrices)[0],
    locationId: string,
    value: any
  ) => {
    const newPrice =
      this.props.variant.locationPrices &&
      this.props.variant.locationPrices.length > 0
        ? this.props.variant.locationPrices.map((lPrice) => ({
            ...lPrice,
            [field]: lPrice.locationId === locationId ? value : lPrice[field],
          }))
        : [{ locationId: locationId, individualPrice: 0, [field]: value }];

    this.props.onChange({
      ...this.props.variant,
      locationPrices: newPrice,
    });
  };

  render() {
    const { variant, onRemove } = this.props;
    return (
      <div
        style={{
          border: '1px solid #ddd',
          padding: '12px',
          marginTop: '10px',
          borderRadius: '6px',
        }}
      >
        <div
          style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '10px' }}
        >
          <MLStringEditor
            caption="Label"
            defaultValue={variant.label}
            onChange={(val) => this.update('label', val)}
          />
        </div>
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: '1fr 1fr',
            gap: '10px',
            marginTop: '10px',
          }}
        >
          <div>
            {this.props.locations.map((location) => {
              const lPrice = variant.locationPrices?.find(
                (locationPrice) => locationPrice.locationId === location.id
              );
              return (
                <div key={location.id}>
                  {location.name}
                  <label className="cj-label">
                    Individual Price
                    <input
                      type="number"
                      className="cj-input material-input"
                      value={lPrice?.individualPrice}
                      onChange={(e) =>
                        this.updatePrice(
                          'individualPrice',
                          location.id,
                          Number(e.target.value)
                        )
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
                        this.updatePrice(
                          'legalEntityPrice',
                          location.id,
                          e.target.value ? Number(e.target.value) : undefined
                        )
                      }
                    />
                  </label>
                </div>
              );
            })}
          </div>
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
