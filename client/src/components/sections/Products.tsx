import { I18nContext, type I18nContextValue } from '../../i18n/I18nContext';
import { IMLString, MLString } from '../../mlstring';
import Proto, { IProtoProps, IProtoState } from '../../proto';
import { MLSTRING_FIELDS } from '../../types/gql';
import { PublicProductData } from '@betypes/product';
import { ProductCard } from './ProductCard';

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
                      <ProductCard
                        user={this.props.user}
                        key={product.id}
                        product={product}
                        companyInfo={this.props.companyInfo} // Передаем пропсы для Proto
                        currentLocation={this.props.currentLocation}
                        onAddToBasket={this.handleAddClick}
                      />
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
