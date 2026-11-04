import { I18nContext, type I18nContextValue } from '../../i18n/I18nContext';
import { IMLString, MLString } from '../../mlstring';
import Proto from '../../proto';
import Photos, { IPhoto } from '../photos/photos';
import { ITags } from '../tags/tags';
import { MLSTRING_FIELDS } from './StaffProducts';

const PUBLIC_PRODUCT_FIELDS = `
    id
    name ${MLSTRING_FIELDS}
    description ${MLSTRING_FIELDS}
    photos
    tags
    chapters
    priority
    priceOptions
    standardDose
    units ${MLSTRING_FIELDS}
    stock
    reserved
`;

const QUERY_PUBLIC_STOCKS = `
query {
  getPublicProductsWithStock {
    ${PUBLIC_PRODUCT_FIELDS}
  }
}`;

interface ProductsProps {
  onAddToBasket: (product: PublicProductData) => void;
  onLegalEntityCtaClick: () => void;
  userEntityType: 'INDIVIDUAL' | 'LEGAL_ENTITY' | null;
}

interface ProductsState {
  loading: boolean;
  error?: string;
  products: PublicProductData[];
  chapters: IMLString[];
}

interface ThresholdDiscount {
  threshold: number;
  discount: number;
}

interface PriceVariation {
  label: IMLString;
  locationId?: string;
  currency?: IMLString;
  individualPrice?: number;
  legalPrice?: number;
  individualDiscounts?: ThresholdDiscount[];
  legalDiscount?: ThresholdDiscount[];
  standardDose: number;
  units: IMLString;
}

export interface PublicProductData {
  id: string;
  name: IMLString;
  description: IMLString;
  photos: IPhoto[];
  tags: ITags;
  chapters: IMLString[];
  priority: number;
  standardDose: number;
  units: IMLString;
  priceOptions: {
    currency?: IMLString;
    individualPrice?: number;
    legalPrice?: number;
    individualDiscounts?: ThresholdDiscount[];
    legalDiscount?: ThresholdDiscount[];
    variations?: PriceVariation[];
  };
  stock: number;
  reserved: number;
}

export interface BasketItem {
  product: PublicProductData;
  choosenVariation?: PriceVariation;
  discount?: ThresholdDiscount;
  quantity: number;
  price: number;
  amount: number;
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
      if (products.filter((el) => el.chapters.length === 0)) chapters.push('');
      this.setState(
        {
          loading: false,
          products,
          chapters,
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
    if (this.props.userEntityType === 'LEGAL_ENTITY') {
      if (!product.priceOptions.legalDiscount?.length) {
        return [] as string[];
      }

      return product.priceOptions.legalDiscount.map(
        (tier) => `${tier.threshold}+ → -${tier.discount}%`
      );
    }

    if (!product.priceOptions.individualDiscounts?.length) {
      return [] as string[];
    }

    return product.priceOptions.individualDiscounts.map(
      (tier) => `${tier.threshold}+ → -${tier.discount}%`
    );
  };

  productEffectivePrice(product: PublicProductData): string {
    return `${this.props.userEntityType === 'LEGAL_ENTITY' ? product.priceOptions.legalPrice : product.priceOptions.individualPrice} ${new MLString(product.priceOptions.currency).toString()}`;
  }

  private handleAddClick = (product: PublicProductData) => {
    this.props.onAddToBasket(product);
  };

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
          {this.props.userEntityType === 'LEGAL_ENTITY' ? (
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
                ? products.filter((p) => p.chapters.length === 0)
                : products.filter((p) =>
                    p.chapters
                      .map((el) => new MLString(el).toString())
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
                        {product.priceOptions.variations &&
                        product.priceOptions.variations.filter(
                          (el) =>
                            el.locationId === '' || el.locationId === undefined
                        ).length > 0 ? (
                          <div>
                            <ul className="product-price-variations">
                              <li className="product-price-variation-row">
                                <button
                                  type="button"
                                  className="product-price-variation-button is-active"
                                  onClick={() => {}}
                                  aria-label=""
                                  aria-pressed={true}
                                >
                                  <span className="product-price-variation-label-group">
                                    <span className="product-price-variation-label">
                                      {product.standardDose}
                                      {product.units
                                        ? new MLString(product.units).toString()
                                        : 'g'}
                                    </span>
                                  </span>
                                  <strong className="product-price-variation-value">
                                    {this.productEffectivePrice(product)}
                                  </strong>
                                </button>
                              </li>
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
                            {this.productEffectivePrice(product)}
                          </span>
                          <button
                            className="add-btn"
                            onClick={() => this.handleAddClick(product)}
                          >
                            {this.ML('Add to basket').toString()}
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
