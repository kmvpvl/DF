import React from 'react';
import { Product, ProductPriceVariation } from '../../App';
import { I18nContext, type I18nContextValue } from '../../i18n/I18nContext';

const INDIVIDUAL_DISCOUNT_MIN_GRAMS = 1000;
const INDIVIDUAL_DISCOUNT_RATE = 0.1;
const WEIGHT_BASED_PRODUCT_IDS = new Set([13]);

interface ProductsProps {
  onAddToBasket: (product: Product) => void;
  onLegalEntityCtaClick: () => void;
  userEntityType: 'INDIVIDUAL' | 'LEGAL_ENTITY' | null;
}

interface ProductsState {
  activePhotoByProductId: Record<number, number>;
  activeVariationByProductId: Record<number, number>;
  cheeseWeightByProductId: Record<number, string>;
  cheeseWeightErrorByProductId: Record<number, boolean>;
}

class Products extends React.Component<ProductsProps, ProductsState> {
  static contextType = I18nContext;
  declare context: I18nContextValue | null;

  state: ProductsState = {
    activePhotoByProductId: {},
    activeVariationByProductId: {},
    cheeseWeightByProductId: {},
    cheeseWeightErrorByProductId: {},
  };

  private isCheeseProduct = (product: Product) => product.chapter === 'cheeses';

  private isWeightBasedProduct = (product: Product) => WEIGHT_BASED_PRODUCT_IDS.has(product.id);

  private usesWeightInput = (product: Product) =>
    this.isWeightBasedProduct(product) ||
    (this.isCheeseProduct(product) && !(product.priceVariations && product.priceVariations.length > 0));

  private hasSyncedPhotoAndVariation = (product: Product) =>
    Boolean(
      product.photos?.length &&
        product.priceVariations?.length &&
        product.photos.length === product.priceVariations.length
    );

  private getDefaultVariationIndex = (product: Product) => {
    if (!product.priceVariations?.length) {
      return 0;
    }

    const matchedIndex = product.priceVariations.findIndex(
      (variation) =>
        variation.price === product.price &&
        (variation.unit ?? product.priceUnit) === product.priceUnit
    );

    return matchedIndex >= 0 ? matchedIndex : 0;
  };

  private getActiveVariationIndex = (product: Product) => {
    if (!product.priceVariations?.length) {
      return 0;
    }

    return this.state.activeVariationByProductId[product.id] ?? this.getDefaultVariationIndex(product);
  };

  private getSelectedVariation = (product: Product) => {
    if (!product.priceVariations?.length) {
      return null;
    }

    return product.priceVariations[this.getActiveVariationIndex(product)] ?? null;
  };

  private getActivePhotoIndex = (product: Product) => {
    if (!product.photos?.length) {
      return 0;
    }

    const defaultIndex = this.hasSyncedPhotoAndVariation(product)
      ? this.getDefaultVariationIndex(product)
      : 0;
    const activeIndex = this.state.activePhotoByProductId[product.id] ?? defaultIndex;
    return Math.min(activeIndex, product.photos.length - 1);
  };

  private setActivePhoto = (productId: number, photoIndex: number) => {
    this.setState(prevState => ({
      activePhotoByProductId: {
        ...prevState.activePhotoByProductId,
        [productId]: photoIndex,
      },
    }));
  };

  private setActiveVariation = (productId: number, variationIndex: number) => {
    this.setState((prevState) => ({
      activeVariationByProductId: {
        ...prevState.activeVariationByProductId,
        [productId]: variationIndex,
      },
    }));
  };

  private showNextPhoto = (product: Product) => {
    if (!product.photos?.length) {
      return;
    }

    const currentIndex = this.getActivePhotoIndex(product);
    const nextIndex = (currentIndex + 1) % product.photos.length;
    this.setActivePhoto(product.id, nextIndex);
    if (this.hasSyncedPhotoAndVariation(product)) {
      this.setActiveVariation(product.id, nextIndex);
    }
  };

  private selectVariation = (product: Product, variationIndex: number) => {
    this.setActiveVariation(product.id, variationIndex);
    if (this.hasSyncedPhotoAndVariation(product)) {
      this.setActivePhoto(product.id, variationIndex);
    }
  };

  private formatPrice = (price: number, unit?: string) => {
    if (unit) {
      const normalizedPrice = Number.isInteger(price) ? price.toString() : price.toFixed(2);
      return `${normalizedPrice} ${unit}`;
    }

    return `€${price.toFixed(2)}`;
  };

  private getEffectivePrice = (
    individualPrice: number,
    legalEntityPrice?: number
  ) => {
    if (
      this.props.userEntityType === 'LEGAL_ENTITY' &&
      typeof legalEntityPrice === 'number'
    ) {
      return legalEntityPrice;
    }

    return individualPrice;
  };

  private applyIndividualWeightDiscount = (
    price: number,
    weightInGrams?: number,
    isRelatedProduct = false
  ) => {
    if (
      isRelatedProduct ||
      this.props.userEntityType === 'LEGAL_ENTITY' ||
      !weightInGrams ||
      weightInGrams < INDIVIDUAL_DISCOUNT_MIN_GRAMS
    ) {
      return price;
    }

    return Number((price * (1 - INDIVIDUAL_DISCOUNT_RATE)).toFixed(2));
  };

  private formatWeight = (weight?: number, unit?: string) => {
    if (!weight || !unit) {
      return null;
    }

    return `${weight} ${unit}`;
  };

  private shouldShowVariationWeight = (variation: ProductPriceVariation) => {
    const formattedWeight = this.formatWeight(variation.weight, variation.weightUnit);
    if (!formattedWeight) {
      return false;
    }

    const normalize = (value: string) => value.replace(/\s+/g, '').toLowerCase();
    return normalize(variation.label) !== normalize(formattedWeight);
  };

  private getDiscountLabels = (product: Product) => {
    if (product.chapter === 'related') {
      return [] as string[];
    }

    const { dictionary } = this.context as I18nContextValue;

    if (this.props.userEntityType === 'LEGAL_ENTITY') {
      return [
        dictionary.products.legalEntityDiscountFrom2kg,
        dictionary.products.legalEntityDiscountFrom3kg,
      ];
    }

    if (product.discounts?.length) {
      return [dictionary.products.individualDiscountFrom1000g];
    }

    return [] as string[];
  };

  private getProductForBasket = (product: Product) => {
    const isRelatedProduct = product.chapter === 'related';
    const selectedVariation = this.getSelectedVariation(product);

    if (this.usesWeightInput(product)) {
      const weightValue = this.state.cheeseWeightByProductId[product.id] ?? '1000';
      const weightInGrams = Number.parseFloat(weightValue);
      if (!Number.isFinite(weightInGrams) || weightInGrams <= 0) {
        return null;
      }

      const unitPrice = this.getEffectivePrice(product.price, product.legalEntityPrice);
      const discountedUnitPrice = this.applyIndividualWeightDiscount(
        unitPrice,
        weightInGrams,
        isRelatedProduct
      );

      return {
        ...product,
        name: selectedVariation
          ? `${product.name} (${selectedVariation.label}, ${weightInGrams}g)`
          : `${product.name} (${weightInGrams}g)`,
        price: Number(((discountedUnitPrice * weightInGrams) / 1000).toFixed(2)),
        selectedWeightGrams: weightInGrams,
        selectedVariationLabel: selectedVariation?.label,
      };
    }

    if (!selectedVariation) {
      return product;
    }

    return {
      ...product,
      name: `${product.name} (${selectedVariation.label})`,
      price: this.applyIndividualWeightDiscount(
        this.getEffectivePrice(
          selectedVariation.price,
          selectedVariation.legalEntityPrice
        ),
        selectedVariation.weight,
        isRelatedProduct
      ),
      priceUnit: selectedVariation.unit ?? product.priceUnit,
      selectedVariationLabel: selectedVariation.label,
    };
  };

  private onCheeseWeightChange = (productId: number, value: string) => {
    this.setState((prevState) => ({
      cheeseWeightByProductId: {
        ...prevState.cheeseWeightByProductId,
        [productId]: value,
      },
      cheeseWeightErrorByProductId: {
        ...prevState.cheeseWeightErrorByProductId,
        [productId]: false,
      },
    }));
  };

  private getDisplayedPrice = (product: Product) => {
    const isRelatedProduct = product.chapter === 'related';

    if (!this.usesWeightInput(product)) {
      const selectedVariation = this.getSelectedVariation(product);
      if (selectedVariation) {
        return this.applyIndividualWeightDiscount(
          this.getEffectivePrice(
            selectedVariation.price,
            selectedVariation.legalEntityPrice
          ),
          selectedVariation.weight,
          isRelatedProduct
        );
      }

      return this.applyIndividualWeightDiscount(
        this.getEffectivePrice(product.price, product.legalEntityPrice),
        undefined,
        isRelatedProduct
      );
    }

    const weightValue = this.state.cheeseWeightByProductId[product.id] ?? '1000';
    const weightInGrams = Number.parseFloat(weightValue);
    if (!Number.isFinite(weightInGrams) || weightInGrams <= 0) {
      return this.getEffectivePrice(product.price, product.legalEntityPrice);
    }

    const unitPrice = this.getEffectivePrice(product.price, product.legalEntityPrice);
    const discountedUnitPrice = this.applyIndividualWeightDiscount(
      unitPrice,
      weightInGrams,
      isRelatedProduct
    );
    return Number(((discountedUnitPrice * weightInGrams) / 1000).toFixed(2));
  };

  private handleAddClick = (product: Product) => {
    const productForBasket = this.getProductForBasket(product);
    if (!productForBasket) {
      this.setState((prevState) => ({
        cheeseWeightErrorByProductId: {
          ...prevState.cheeseWeightErrorByProductId,
          [product.id]: true,
        },
      }));
      return;
    }

    this.props.onAddToBasket(productForBasket);
  };

  render() {
    const i18n = this.context;
    if (!i18n) {
      throw new Error('Products must be used within I18nProvider');
    }

    const { dictionary } = i18n;
    const products = dictionary.products.items as unknown as Product[];
    const chapterLabels = dictionary.products.chapterLabels as Record<string, string>;
    const chapterOrder = dictionary.products.chapterOrder as string[];

    return (
      <div id="products" className="products-section">
        <div className="section-inner">
          <p className="section-label">{dictionary.products.label}</p>
          <h2 className="section-title">{dictionary.products.title}</h2>
          <p className="section-desc">{dictionary.products.description}</p>
          {this.props.userEntityType === 'LEGAL_ENTITY' ? (
            <div className="products-legal-entity-banner">
              {dictionary.products.legalEntityLoggedInBannerPre}
              <a
                href={`tel:${dictionary.contacts.phoneValue.replace(/\s+/g, '')}`}
                className="products-legal-entity-banner-link"
              >
                {dictionary.products.legalEntityLoggedInBannerCallUs}
              </a>
              {dictionary.products.legalEntityLoggedInBannerPost}
            </div>
          ) : (
            <button
              type="button"
              className="btn-primary products-legal-cta"
              onClick={this.props.onLegalEntityCtaClick}
            >
              {dictionary.products.legalEntityCta}
            </button>
          )}

          {chapterOrder.map((chapterId) => {
            const items = products.filter((p) => p.chapter === chapterId);
            return (
              <div key={chapterId} className="products-chapter">
                <h3 className="products-chapter-title">
                  {chapterLabels[chapterId] ?? chapterId}
                </h3>
                {items.length > 0 ? (
                  <div className="products-grid">
                    {items.map((product) => (
                      <div key={product.id} className="product-card">
                        {product.photos && product.photos.length > 0 ? (
                          <>
                            <button
                              type="button"
                              className="product-media-button"
                              onClick={() => this.showNextPhoto(product)}
                              aria-label={`Show next photo for ${product.name}`}
                            >
                              <div className="product-media">
                                <img
                                  className="product-photo"
                                  src={product.photos[this.getActivePhotoIndex(product)]}
                                  alt={product.name}
                                />
                              </div>
                            </button>
                            <div className="product-photo-dots" aria-label={`${product.name} photos`}>
                              {product.photos.map((photo, index) => (
                                <button
                                  key={photo}
                                  type="button"
                                  className={
                                    index === this.getActivePhotoIndex(product)
                                      ? 'product-photo-dot is-active'
                                      : 'product-photo-dot'
                                  }
                                  onClick={() => {
                                    this.setActivePhoto(product.id, index);
                                    if (this.hasSyncedPhotoAndVariation(product)) {
                                      this.setActiveVariation(product.id, index);
                                    }
                                  }}
                                  aria-label={`Show photo ${index + 1} for ${product.name}`}
                                  aria-pressed={index === this.getActivePhotoIndex(product)}
                                />
                              ))}
                            </div>
                          </>
                        ) : (
                          <div className="product-emoji">{product.emoji}</div>
                        )}
                        <div className="product-name">{product.name}</div>
                        <div className="product-desc">{product.description}</div>
                        {this.getDiscountLabels(product).length > 0 && (
                          <ul className="product-discounts">
                            {this.getDiscountLabels(product).map((discountLabel) => (
                              <li key={discountLabel} className="product-discount-tier">
                                <strong>{discountLabel}</strong>
                              </li>
                            ))}
                          </ul>
                        )}
                        {product.priceVariations && product.priceVariations.length > 0 && (
                          <ul className="product-price-variations">
                            {(product.priceVariations as ProductPriceVariation[]).map((variation) => (
                              <li key={variation.label} className="product-price-variation-row">
                                <button
                                  type="button"
                                  className={
                                    this.getSelectedVariation(product)?.label === variation.label
                                      ? 'product-price-variation-button is-active'
                                      : 'product-price-variation-button'
                                  }
                                  onClick={() =>
                                    this.selectVariation(
                                      product,
                                      product.priceVariations?.findIndex(
                                        (candidate) => candidate.label === variation.label
                                      ) ?? 0
                                    )
                                  }
                                  aria-label={`Select ${variation.label} option for ${product.name}`}
                                  aria-pressed={this.getSelectedVariation(product)?.label === variation.label}
                                >
                                  <span className="product-price-variation-label-group">
                                    <span className="product-price-variation-label">{variation.label}</span>
                                    {this.shouldShowVariationWeight(variation) && (
                                      <span className="product-price-variation-weight">
                                        {this.formatWeight(variation.weight, variation.weightUnit)}
                                      </span>
                                    )}
                                  </span>
                                  <strong className="product-price-variation-value">
                                    {this.formatPrice(
                                      this.applyIndividualWeightDiscount(
                                        this.getEffectivePrice(
                                          variation.price,
                                          variation.legalEntityPrice
                                        ),
                                        variation.weight,
                                        product.chapter === 'related'
                                      ),
                                      variation.unit
                                    )}
                                  </strong>
                                </button>
                              </li>
                            ))}
                          </ul>
                        )}
                        {this.usesWeightInput(product) && (
                          <div className="product-weight-block">
                            <label className="product-weight-label" htmlFor={`weight-${product.id}`}>
                              {dictionary.products.cheeseWeightLabel}
                            </label>
                            <input
                              id={`weight-${product.id}`}
                              className={
                                this.state.cheeseWeightErrorByProductId[product.id]
                                  ? 'product-weight-input is-invalid'
                                  : 'product-weight-input'
                              }
                              type="number"
                              min="1"
                              step="1"
                              inputMode="numeric"
                              value={this.state.cheeseWeightByProductId[product.id] ?? '1000'}
                              onChange={(e) => this.onCheeseWeightChange(product.id, e.target.value)}
                              placeholder={dictionary.products.cheeseWeightPlaceholder}
                            />
                            {this.state.cheeseWeightErrorByProductId[product.id] && (
                              <div className="product-weight-error">{dictionary.products.cheeseWeightRequired}</div>
                            )}
                          </div>
                        )}
                        <div className="product-footer">
                          <span className="product-price" data-testid={`product-price-${product.id}`}>
                            {this.formatPrice(
                              this.getDisplayedPrice(product),
                              this.getSelectedVariation(product)?.unit ?? product.priceUnit
                            )}
                          </span>
                          <button
                            className="add-btn"
                            onClick={() => this.handleAddClick(product)}
                          >
                            {dictionary.products.addToBasket}
                          </button>
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
