import Proto, { IProtoProps, IProtoState } from '../../proto';
import Photos from '../photos/photos';
import {
  IDiscountTier,
  IPriceDetail,
  PublicProductData,
} from '@betypes/product';
import { IOrderProduct } from './Orders';
import { Fragment } from 'react/jsx-runtime';

interface ProductCardProps extends IProtoProps {
  product: PublicProductData;
  onAddToBasket: (product: IOrderProduct) => void;
  showOnlyInStock: boolean;
}

interface ProductCardState extends IProtoState {
  availableProduct: PublicProductData;
  variantSelected?: string;
}

export class ProductCard extends Proto<ProductCardProps, ProductCardState> {
  state: ProductCardState = {
    availableProduct: {
      ...this.props.product,
      variants: this.props.product.variants.filter((v) =>
        this.props.product.stockBalances.some(
          (s) =>
            s.variantLabel ===
              (typeof v.label === 'string' ? v.label : v.label.default) &&
            s.physical_balance - s.reserved_balance > 0
        )
      ),
    },
  };
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
    return this.toCurrency(
      this.props.user?.entityType === 'LEGAL_ENTITY'
        ? (p?.legalEntityPrice ?? p?.individualPrice)
        : p?.individualPrice
    );
  }

  protected getDiscounts(p?: IPriceDetail): IDiscountTier[] {
    if (!p) return [];
    if (this.props.user?.entityType === 'LEGAL_ENTITY') {
      return p.legalDiscounts ?? [];
    } else {
      return p.individualDiscounts ?? [];
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
        <div className="product-name">{this.toString(product.name)}</div>
        <div
          className="product-desc"
          dangerouslySetInnerHTML={{
            __html: this.toString(product.description),
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

              return !this.props.showOnlyInStock ||
                (variantStocks &&
                  variantStocks.physical_balance -
                    variantStocks.reserved_balance >
                    0) ? (
                <li key={variant.id} className="product-price-variation-row">
                  <span
                    className={`product-price-variation-button ${variant.id === this.state.variantSelected ? 'is-active' : ''}`}
                    onClick={() =>
                      this.changeCurrentVariant.call(this, variant.id!)
                    }
                  >
                    <span className="product-price-variation-label-group">
                      <span className="product-price-variation-label">
                        {this.toString(variant.label)}
                      </span>
                      <span className="product-price-variation-weight">
                        {`${variant.weight} ${variant.weightUnit}`}
                      </span>
                      <span className="product-available">
                        {this.props.showOnlyInStock ||
                        (variantStocks?.physical_balance ?? 0) -
                          (variantStocks?.reserved_balance ?? 0) >
                          0
                          ? `(${this.ML('available')}: ${(variantStocks?.physical_balance ?? 0) - (variantStocks?.reserved_balance ?? 0)})`
                          : null}
                      </span>
                      {this.getDiscounts(lPrice).length > 0 ? (
                        <ul className="product-discounts">
                          {this.getDiscounts(lPrice).map((dt) => (
                            <li
                              key={dt.threshold}
                              className="product-discount-tier"
                            >
                              <strong>
                                {dt.threshold}+ → {dt.discount}%
                              </strong>
                            </li>
                          ))}
                        </ul>
                      ) : (
                        <></>
                      )}
                    </span>
                    <strong className="product-price-variation-value">
                      {this.effectivePrice(lPrice)}
                    </strong>
                    {variant.id === this.state.variantSelected ? (
                      <button
                        className="add-btn"
                        onClick={() =>
                          onAddToBasket({
                            productId: product.id!,
                            quantity: 1,
                            variantLabel:
                              typeof variant.label === 'string'
                                ? variant.label
                                : variant.label.default,
                          })
                        }
                      >
                        →🛒
                      </button>
                    ) : (
                      <></>
                    )}
                  </span>
                </li>
              ) : (
                <Fragment key={variant.id}></Fragment>
              );
            })}
          </ul>
        )}
      </div>
    );
  }
}
