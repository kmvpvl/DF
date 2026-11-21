import Proto, { IProtoProps, IProtoState } from '../../proto';
import { MLSTRING_FIELDS } from '../../types/gql';
import { PublicProductData } from '@betypes/product';
import { ProductCard } from './ProductCard';
import { IOrderProduct } from './Orders';
import { Fragment } from 'react/jsx-runtime';
import { Toggle } from '../toggle/toggle';
import React from 'react';

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
  productionHours
  name ${MLSTRING_FIELDS}
  description ${MLSTRING_FIELDS}
  ${NESTED_PRODUCT_FIELDS}
`;

export const PUBLIC_PRODUCT_FIELDS = `
  id
  productionHours
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
  productionHours
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

interface ProductsProps extends IProtoProps {
  onAddToBasket: (product: IOrderProduct) => void;
  onLegalEntityCtaClick: () => void;
  products: PublicProductData[];
}

interface ProductsState extends IProtoState {
  showOnlyInStock?: boolean;
}

class Products extends Proto<ProductsProps, ProductsState> {
  searchInputRef: React.RefObject<HTMLInputElement> = React.createRef();

  state: ProductsState = {
    showOnlyInStock: false,
  };

  private handleAddClick = (product: IOrderProduct) => {
    this.props.onAddToBasket(product);
  };

  render() {
    const chaptersOut = [
      ...new Set(this.props.products.flatMap((val) => val.chapters)),
    ];
    if (this.props.products.filter((el) => el.chapters?.length === 0))
      chaptersOut.push('');

    //const { dictionary } = dictionaries.en as I18nContextValue;
    //const products = dictionaries.en.products.items as unknown as Product[];
    /*const chapterLabels = dictionaries.en.products.chapterLabels as Record<
      string,
      string
    >;*/
    //const chapterOrder = dictionaries.en.products.chapterOrder as string[];
    const chapters = chaptersOut.map((el) => this.toString(el));
    const products = this.props.products;

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
          ) : (null)}

          <div className="products-search-toolbar">
            <Toggle
              defaultChecked={this.state.showOnlyInStock ?? false}
              onChange={(checked) =>
                this.setState({ showOnlyInStock: checked })
              }
            />
            <input
              placeholder={this.ML('Search products...').toString()}
              className="products-search-input"
              ref={this.searchInputRef}
              onChange={() => this.forceUpdate()}
            />
          </div>

          {chapters.map((chapter, chapterId) => {
            let items =
              chapter.toString() === ''
                ? products.filter((p) => p.chapters?.length === 0)
                : products.filter((p) =>
                    p.chapters
                      ?.map((el) => this.toString(el))
                      .includes(chapter.toString())
                  );
            if (this.searchInputRef.current?.value) {
              const searchTerm =
                this.searchInputRef.current.value.toLowerCase();
              items = items.filter((product) =>
                JSON.stringify(product).toLowerCase().includes(searchTerm)
              );
            }
            return (
              <div key={chapterId} className="products-chapter">
                <h3 className="products-chapter-title">
                  {chapter.toString() !== ''
                    ? chapter.toString()
                    : this.ML('Others')}
                </h3>
                {items.length > 0 ? (
                  <div className="products-grid">
                    {items.map((product) =>
                      !this.state.showOnlyInStock ||
                      ProductCard.isAvailable(product) ? (
                        <ProductCard
                          user={this.props.user}
                          key={product.id}
                          product={product}
                          companyInfo={this.props.companyInfo} // Передаем пропсы для Proto
                          currentLocation={this.props.currentLocation}
                          onAddToBasket={this.handleAddClick}
                          showOnlyInStock={this.state.showOnlyInStock ?? false}
                        />
                      ) : (
                        <Fragment key={product.id}></Fragment>
                      )
                    )}
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
