import { I18nContext, type I18nContextValue } from '../../i18n/I18nContext';
import { IMLString, MLString } from '../../mlstring';
import Proto, { IProtoProps, IProtoState } from '../../proto';
import { MLSTRING_FIELDS } from '../../types/gql';
import Photos from '../photos/photos';
import { IPriceDetail, PublicProductData } from '@betypes/product';

export const NESTED_PRODUCT_FIELDS = `
  # 1. Вариации товара (например: разные объемы или веса)
  variants {
    id
    sku
    label ${MLSTRING_FIELDS}
    isWeightBased
    weight
    weightUnit
    
    # Цены и скидки только для текущей локации пользователя!
    locationPrices {
      locationId
      individualPrice
      legalEntityPrice
      individualDiscounts # Вернет JSON [{ threshold: 10, discount: 5 }]
      isAvailable
    }
  }
  # 2. Опциональные компоненты (Топпинги / Модификаторы)
  modifierGroups {
    id
    isRequired
    minSelect
    maxSelect
    title ${MLSTRING_FIELDS}
    modifiers {
      id
      name ${MLSTRING_FIELDS}
      # Цена топпинга на данной точке
      locationPrices {
        individualPrice
        isAvailable
      }
    }
  }
  # 3. Если это комбо-набор — запрашиваем состав
  comboItems {
    id
    quantity
    sourceProduct {
      id
      name ${MLSTRING_FIELDS}
    }
  }
`;

export const SLIM_PRODUCT_FIELDS = `
  id
  name ${MLSTRING_FIELDS}
  description ${MLSTRING_FIELDS}
  ${NESTED_PRODUCT_FIELDS}
`;

export const PUBLIC_PRODUCT_FIELDS = `
  id
  name ${MLSTRING_FIELDS}
  description ${MLSTRING_FIELDS}
  photos
  tags
  chapters
  priority
  standardDose
  units ${MLSTRING_FIELDS}
  ${NESTED_PRODUCT_FIELDS}
`;

export const ALL_PRODUCT_FIELDS = `
  id
  batchPrefix
  name ${MLSTRING_FIELDS}
  description ${MLSTRING_FIELDS}
  photos
  tags
  caloriesKcal
  fatGrams
  proteinGrams
  carbohydratesGrams
  sugarsGrams
  fiberGrams
  saltGrams
  chapters
  priority
  standardDose
  units
  chapters
  isPublic
  priority
  ${NESTED_PRODUCT_FIELDS}
  createdAt
  updatedAt
`;

const QUERY_PUBLIC_STOCKS = `
query {
  getPublicProductsWithStock {
    ${PUBLIC_PRODUCT_FIELDS}
    stock
    reserved
  }
}`;

interface ProductsProps extends IProtoProps {
  onAddToBasket: (product: PublicProductData) => void;
  onLegalEntityCtaClick: () => void;
}

interface ProductsState extends IProtoState {
  loading: boolean;
  error?: string;
  products: PublicProductData[];
  chapters: (IMLString | undefined)[];
}

class Products extends Proto<ProductsProps, ProductsState> {
  static contextType = I18nContext;
  declare context: I18nContextValue | null;

  state: ProductsState = {
    loading: false,
    products: [],
    chapters: [],
  };

  async fetchProducts() {
    this.setState({ loading: true });

    try {
      const data = await this.gql(QUERY_PUBLIC_STOCKS);
      const products = data.getPublicProductsWithStock as PublicProductData[];
      const chapters = (
        data.getPublicProductsWithStock as PublicProductData[]
      ).flatMap((val) => val.chapters);
      if (products.filter((el) => el.chapters?.length === 0)) chapters.push('');
      this.setState(
        {
          loading: false,
          products,
          chapters: chapters,
        },
        () => {}
      );
    } catch (error) {
      this.setState({ loading: false, error: String(error) });
    }
  }

  componentDidMount(): void {
    this.fetchProducts();
  }

  private getDiscountLabels = (product: PublicProductData) => {
    if (this.props.user?.entityType === 'LEGAL_ENTITY') {
      //return product.priceOptions.legalDiscount.map(
      //  (tier) => `${tier.threshold}+ → -${tier.discount}%`
    }
    return [];
  };

  private handleAddClick = (product: PublicProductData) => {
    this.props.onAddToBasket(product);
  };

  protected effectivePrice(p?: IPriceDetail) {
    const loc = this.props.companyInfo?.locations.find(
      (l) => l.id === this.props.currentLocation
    );
    return `${p ? (this.props.user?.entityType === 'LEGAL_ENTITY' ? (p.legalEntityPrice ?? p.individualPrice) : p.individualPrice) : '-'} ${loc?.currencySymbol}`;
  }

  render() {
    const i18n = this.context;
    if (!i18n) {
      throw new Error('Products must be used within I18nProvider');
    }

    //const { dictionary } = dictionaries.en as I18nContextValue;
    //const products = dictionaries.en.products.items as unknown as Product[];
    /*const chapterLabels = dictionaries.en.products.chapterLabels as Record<
      string,
      string
    >;*/
    //const chapterOrder = dictionaries.en.products.chapterOrder as string[];
    const chapters = this.state.chapters.map((el) => new MLString(el));
    const products = this.state.products;

    return (
      <div id="products" className="products-section">
        <div className="section-inner">
          <p className="section-label">{this.ML('Our Menu').toString()}</p>
          <h2 className="section-title">
            {this.ML('Fresh Every Day').toString()}
          </h2>
          <p className="section-desc">
            {this.ML(
              'Everything is made in small batches from the finest ingredients. Order before noon for same-day delivery.'
            ).toString()}
          </p>
          {this.props.user?.entityType === 'LEGAL_ENTITY' ? (
            <div className="products-legal-entity-banner">
              {this.ML(
                'You are logged in as a legal entity and we guarantee you have the best prices.'
              ).toString()}
              {'\n '}
              <a
                href={`tel:${'062 1478 438'.replace(/\s+/g, '')}`}
                className="products-legal-entity-banner-link"
              >
                {this.ML('Call us to get an even bigger discount').toString()}
              </a>
            </div>
          ) : (
            <button
              type="button"
              className="btn-primary products-legal-cta"
              onClick={this.props.onLegalEntityCtaClick}
            >
              {this.ML(
                'Login as a legal entity to get great prices'
              ).toString()}
            </button>
          )}

          {chapters.map((chapter, chapterId) => {
            const items =
              chapter.toString() === ''
                ? products.filter((p) => p.chapters?.length === 0)
                : products.filter((p) =>
                    p.chapters
                      ?.map((el) => new MLString(el).toString())
                      .includes(chapter.toString())
                  );
            return (
              <div key={chapterId} className="products-chapter">
                <h3 className="products-chapter-title">
                  {chapter.toString() !== ''
                    ? chapter.toString()
                    : this.ML('Others')}
                </h3>
                {items.length > 0 ? (
                  <div className="products-grid">
                    {items.map((product) => (
                      <div key={product.id} className="product-card">
                        {product.photos && product.photos.length > 0 ? (
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
                        ) : (
                          ''
                        )}
                        <div className="product-name">
                          {new MLString(product.name).toString()}
                        </div>
                        <div
                          className="product-desc"
                          dangerouslySetInnerHTML={{
                            __html: new MLString(
                              product.description
                            ).toString(),
                          }}
                        ></div>
                        {product.variants.length > 0 ? (
                          <div>
                            <ul className="product-price-variations">
                              {product.variants.map((variant) => {
                                const lPrice = variant.locationPrices.find(
                                  (l) =>
                                    l.locationId === this.props.currentLocation
                                );
                                return (
                                  <li
                                    key={variant.id}
                                    className="product-price-variation-row"
                                  >
                                    <button
                                      type="button"
                                      className="product-price-variation-button is-active"
                                      onClick={() => {}}
                                      aria-label=""
                                      aria-pressed={true}
                                    >
                                      <span className="product-price-variation-label-group">
                                        <span className="product-price-variation-label">
                                          {new MLString(
                                            variant.label
                                          ).toString()}
                                        </span>
                                        <span className="product-price-variation-weight">
                                          {`${variant.weight} ${variant.weightUnit}`}
                                        </span>
                                      </span>
                                      <strong className="product-price-variation-value">
                                        {this.effectivePrice(lPrice)}
                                      </strong>
                                      <button
                                        className="add-btn"
                                        onClick={() =>
                                          this.handleAddClick(product)
                                        }
                                      >
                                        →🛒
                                      </button>
                                    </button>
                                  </li>
                                );
                              })}
                            </ul>
                          </div>
                        ) : (
                          <></>
                        )}
                        <div>
                          {this.getDiscountLabels(product).length > 0 && (
                            <ul className="product-discounts">
                              {this.getDiscountLabels(product).map(
                                (discountLabel) => (
                                  <li
                                    key={discountLabel}
                                    className="product-discount-tier"
                                  >
                                    <strong>{discountLabel}</strong>
                                  </li>
                                )
                              )}
                            </ul>
                          )}
                        </div>
                        <div className="product-footer">
                          <span
                            className="product-price"
                            data-testid={`product-price-${product.id}`}
                          >
                            ***
                          </span>
                          <button
                            className="add-btn"
                            onClick={() => this.handleAddClick(product)}
                          >
                            →🛒
                          </button>
                        </div>
                        <div className="product-footer">
                          <span className="product-desc">
                            {this.ML('Доступно прямо сейчас')}
                          </span>
                          <strong>{product.stock}</strong>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="products-chapter-empty">Coming soon…</p>
                )}
              </div>
            );
          })}
        </div>
      </div>
    );
  }
}

export default Products;
