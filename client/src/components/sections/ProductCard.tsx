import { MLString } from '../../mlstring';
import Proto, { IProtoProps, IProtoState } from '../../proto';
import Photos from '../photos/photos';
import {
  IDiscountTier,
  IPriceDetail,
  PublicProductData,
} from '@betypes/product';

interface ProductCardProps extends IProtoProps {
  product: PublicProductData;
  onAddToBasket: (product: PublicProductData) => void;
}

interface ProductCardState extends IProtoState {
  availableProduct: PublicProductData;
  variantSelected?: string;
}

export class ProductCard extends Proto<ProductCardProps, ProductCardState> {
  state: ProductCardState = {
    availableProduct: {
      ...this.props.product,
      variants: this.props.product.variants.filter(v=> this.props.product.stockBalances.some(s=>s.variantLabel === (typeof v.label  === "string"?v.label:v.label.default) && s.physical_balance-s.reserved_balance>0)),
    }
  }
  static isAvailable(product: PublicProductData) {
    return product.variants.some((variant) =>
      product.stockBalances.some(
        (stock) =>
          stock.variantLabel ===
            (typeof variant.label === 'string'
              ? variant.label
              : variant.label.default) &&
          stock.physical_balance - stock.reserved_balance > 0
      )
    );
  }
  componentDidMount(): void {
    if (this.state.variantSelected === undefined) {
      this.setState((prevState) => ({
        ...prevState,
        variantSelected: prevState.availableProduct.variants[0]?.id,
      }));
    }
  }

  protected effectivePrice(p?: IPriceDetail) {
    const loc = this.props.companyInfo?.locations.find(
      (l) => l.id === this.props.currentLocation
    );
    return `${p ? (this.props.user?.entityType === 'LEGAL_ENTITY' ? (p.legalEntityPrice ?? p.individualPrice) : p.individualPrice) : '-'} ${loc?.currencySymbol}`;
  }

  protected getDiscounts(): IDiscountTier[] {
    const ldVar = this.props.product.variants.find(
      (v) => v.id === this.state.variantSelected
    );
    if (!ldVar) return [];
    const ldPrice = ldVar.locationPrices.find(
      (p) => p.locationId === this.props.currentLocation
    );
    if (!ldPrice) return [];
    if (this.props.user?.entityType === 'LEGAL_ENTITY') {
      return ldPrice.legalDiscounts ?? [];
    } else {
      return ldPrice.individualDiscounts ?? [];
    }
  }

  changeCurrentVariant(newVariant: string) {
    this.setState({
      ...this.state,
      variantSelected: newVariant,
    });
  }

  render() {
    const { product, onAddToBasket } = this.props;
    let lDPrice: IPriceDetail;
    return (
      <div className="product-card">
        {product.photos && product.photos.length > 0 && (
          <>
            <Photos
              className="product-media-button"
              editMode={false}
              defaultValue={product.photos}
            />
            <div
              className="product-photo-dots"
              aria-label={`${product.name} photos`}
            ></div>
          </>
        )}
        <div className="product-name">
          {new MLString(product.name).toString()}
        </div>
        <div
          className="product-desc"
          dangerouslySetInnerHTML={{
            __html: new MLString(product.description).toString(),
          }}
        ></div>

        {product.variants.length > 0 && (
          <ul className="product-price-variations">
            {product.variants.map((variant) => {
              const lPrice = variant.locationPrices.find(
                (l) => l.locationId === this.props.currentLocation
              );
              lDPrice = lDPrice;
              const variantStocks = product.stockBalances.find(
                (s) =>
                  s.variantLabel ===
                  (typeof variant.label === 'string'
                    ? variant.label
                    : variant.label.default)
              );

              return variantStocks &&
                variantStocks.physical_balance -
                  variantStocks.reserved_balance ? (
                <li key={variant.id} className="product-price-variation-row">
                  <span
                    className={`product-price-variation-button ${variant.id === this.state.variantSelected ? 'is-active' : ''}`}
                    onClick={() =>
                      this.changeCurrentVariant.call(this, variant.id!)
                    }
                  >
                    <span className="product-price-variation-label-group">
                      <span className="product-price-variation-label">
                        {new MLString(variant.label).toString()}
                      </span>
                      <span className="product-price-variation-weight">
                        {`${variant.weight} ${variant.weightUnit}`}
                      </span>
                      <span className="product-available">{`(${this.ML('available')}: ${variantStocks.physical_balance-variantStocks.reserved_balance})`}</span>
                    </span>
                    <strong className="product-price-variation-value">
                      {this.effectivePrice(lPrice)}
                    </strong>
                    {variant.id === this.state.variantSelected ? (
                      <button
                        className="add-btn"
                        onClick={() => onAddToBasket(product)}
                      >
                        →🛒
                      </button>
                    ) : (
                      <></>
                    )}
                  </span>
                </li>
              ) : (
                <></>
              );
            })}
          </ul>
        )}

        {this.getDiscounts().length > 0 ? (
          <ul className="product-discounts">
            {this.getDiscounts().map((dt) => (
              <li key={dt.threshold} className="product-discount-tier">
                <strong>{dt.threshold}</strong>
              </li>
            ))}
          </ul>
        ) : (
          <></>
        )}

        <div className="product-footer"></div>
      </div>
    );
  }
}
