import { Product, ProductPriceVariation } from '../../App';
import { dictionaries } from '../../i18n/dictionaries';
import { I18nContext, type I18nContextValue } from '../../i18n/I18nContext';
import Proto from '../../proto';

const INDIVIDUAL_DISCOUNT_MIN_GRAMS = 1000;
const INDIVIDUAL_DISCOUNT_RATE = 0.1;
const WEIGHT_BASED_PRODUCT_IDS = new Set([13]);
const SWIPE_THRESHOLD_PX = 30;

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

class Products extends Proto<ProductsProps, ProductsState> {
  static contextType = I18nContext;
  declare context: I18nContextValue | null;
  private touchStartByProductId: Record<number, { x: number; y: number }> = {};
  private suppressClickByProductId: Record<number, boolean> = {};

  state: ProductsState = {
    activePhotoByProductId: {},
    activeVariationByProductId: {},
    cheeseWeightByProductId: {},
    cheeseWeightErrorByProductId: {},
  };

  private isCheeseProduct = (product: Product) => product.chapter === 'cheeses';

  private isWeightBasedProduct = (product: Product) =>
    WEIGHT_BASED_PRODUCT_IDS.has(product.id);

  private usesWeightInput = (product: Product) =>
    this.isWeightBasedProduct(product) ||
    (this.isCheeseProduct(product) &&
      !(product.priceVariations && product.priceVariations.length > 0));

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

    return (
      this.state.activeVariationByProductId[product.id] ??
      this.getDefaultVariationIndex(product)
    );
  };

  private getSelectedVariation = (product: Product) => {
    if (!product.priceVariations?.length) {
      return null;
    }

    return (
      product.priceVariations[this.getActiveVariationIndex(product)] ?? null
    );
  };

  private getActivePhotoIndex = (product: Product) => {
    if (!product.photos?.length) {
      return 0;
    }

    const defaultIndex = this.hasSyncedPhotoAndVariation(product)
      ? this.getDefaultVariationIndex(product)
      : 0;
    const activeIndex =
      this.state.activePhotoByProductId[product.id] ?? defaultIndex;
    return Math.min(activeIndex, product.photos.length - 1);
  };

  private setActivePhoto = (productId: number, photoIndex: number) => {
    this.setState((prevState) => ({
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

  private showPreviousPhoto = (product: Product) => {
    if (!product.photos?.length) {
      return;
    }

    const currentIndex = this.getActivePhotoIndex(product);
    const previousIndex =
      (currentIndex - 1 + product.photos.length) % product.photos.length;
    this.setActivePhoto(product.id, previousIndex);
    if (this.hasSyncedPhotoAndVariation(product)) {
      this.setActiveVariation(product.id, previousIndex);
    }
  };

  private handleMediaClick = (product: Product) => {
    if (this.suppressClickByProductId[product.id]) {
      this.suppressClickByProductId[product.id] = false;
      return;
    }

    this.showNextPhoto(product);
  };

  private handleMediaTouchStart = (
    productId: number,
    event: React.TouchEvent<HTMLButtonElement>
  ) => {
    const touch = event.changedTouches[0];
    this.touchStartByProductId[productId] = { x: touch.clientX, y: touch.clientY };
  };

  private handleMediaTouchEnd = (
    product: Product,
    event: React.TouchEvent<HTMLButtonElement>
  ) => {
    const start = this.touchStartByProductId[product.id];
    if (!start) {
      return;
    }

    const touch = event.changedTouches[0];
    const deltaX = touch.clientX - start.x;
    const deltaY = touch.clientY - start.y;
    delete this.touchStartByProductId[product.id];

    if (
      Math.abs(deltaX) < SWIPE_THRESHOLD_PX ||
      Math.abs(deltaX) <= Math.abs(deltaY)
    ) {
      return;
    }

    this.suppressClickByProductId[product.id] = true;

    if (deltaX < 0) {
      this.showNextPhoto(product);
      return;
    }

    this.showPreviousPhoto(product);
  };

  private selectVariation = (product: Product, variationIndex: number) => {
    this.setActiveVariation(product.id, variationIndex);
    if (this.hasSyncedPhotoAndVariation(product)) {
      this.setActivePhoto(product.id, variationIndex);
    }
  };

  private formatPrice = (price: number, unit?: string) => {
    if (unit) {
      const normalizedPrice = Number.isInteger(price)
        ? price.toString()
        : price.toFixed(2);
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

  private applyWeightDiscount = (
    product: Product,
    price: number,
    weightInGrams?: number,
    isRelatedProduct = false
  ) => {
    if (isRelatedProduct || !weightInGrams) {
      return price;
    }

    if (this.props.userEntityType === 'LEGAL_ENTITY') {
      if (!product.discounts?.length) {
        return price;
      }

      const weightInKg = weightInGrams / 1000;
      const matchedTier = product.discounts
        .slice()
        .sort((a, b) => a.threshold - b.threshold)
        .filter((tier) => weightInKg >= tier.threshold)
        .pop();

      if (!matchedTier) {
        return price;
      }

      return Number((price * (1 - matchedTier.discount / 100)).toFixed(2));
    }

    if (weightInGrams < INDIVIDUAL_DISCOUNT_MIN_GRAMS) {
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
    const formattedWeight = this.formatWeight(
      variation.weight,
      variation.weightUnit
    );
    if (!formattedWeight) {
      return false;
    }

    const normalize = (value: string) =>
      value.replace(/\s+/g, '').toLowerCase();
    return normalize(variation.label) !== normalize(formattedWeight);
  };

  private getDiscountLabels = (product: Product) => {
    if (product.chapter === 'related') {
      return [] as string[];
    }

    const { language } = this.context as I18nContextValue;

    if (this.props.userEntityType === 'LEGAL_ENTITY') {
      if (!product.discounts?.length) {
        return [] as string[];
      }

      const weightUnit = language === 'ru' ? 'кг' : 'kg';
      const orderPrefix =
        language === 'ru'
          ? 'Заказ'
          : language === 'sr'
            ? 'Porudzbina'
            : 'Order';
      return product.discounts.map(
        (tier) =>
          `${orderPrefix} ${tier.threshold}${weightUnit}+ → -${tier.discount}%`
      );
    }

    if (product.discounts?.length) {
      return ['1000g+ → -10%'];
    }

    return [] as string[];
  };

  private getProductForBasket = (product: Product) => {
    const isRelatedProduct = product.chapter === 'related';
    const selectedVariation = this.getSelectedVariation(product);

    if (this.usesWeightInput(product)) {
      const weightValue =
        this.state.cheeseWeightByProductId[product.id] ?? '1000';
      const weightInGrams = Number.parseFloat(weightValue);
      if (!Number.isFinite(weightInGrams) || weightInGrams <= 0) {
        return null;
      }

      const unitPrice = this.getEffectivePrice(
        product.price,
        product.legalEntityPrice
      );
      const discountedUnitPrice = this.applyWeightDiscount(
        product,
        unitPrice,
        weightInGrams,
        isRelatedProduct
      );

      return {
        ...product,
        name: selectedVariation
          ? `${product.name} (${selectedVariation.label}, ${weightInGrams}g)`
          : `${product.name} (${weightInGrams}g)`,
        price: Number(
          ((discountedUnitPrice * weightInGrams) / 1000).toFixed(2)
        ),
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
      price: this.applyWeightDiscount(
        product,
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
        return this.applyWeightDiscount(
          product,
          this.getEffectivePrice(
            selectedVariation.price,
            selectedVariation.legalEntityPrice
          ),
          selectedVariation.weight,
          isRelatedProduct
        );
      }

      return this.applyWeightDiscount(
        product,
        this.getEffectivePrice(product.price, product.legalEntityPrice),
        undefined,
        isRelatedProduct
      );
    }

    const weightValue =
      this.state.cheeseWeightByProductId[product.id] ?? '1000';
    const weightInGrams = Number.parseFloat(weightValue);
    if (!Number.isFinite(weightInGrams) || weightInGrams <= 0) {
      return this.getEffectivePrice(product.price, product.legalEntityPrice);
    }

    const unitPrice = this.getEffectivePrice(
      product.price,
      product.legalEntityPrice
    );
    const discountedUnitPrice = this.applyWeightDiscount(
      product,
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

    //const { dictionary } = dictionaries.en as I18nContextValue;
    const products = dictionaries.en.products.items as unknown as Product[];
    const chapterLabels = dictionaries.en.products.chapterLabels as Record<
      string,
      string
    >;
    const chapterOrder = dictionaries.en.products.chapterOrder as string[];

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

          {chapterOrder.map((chapterId) => {
            const items = products.filter((p) => p.chapter === chapterId);
            return (
              <div key={chapterId} className="products-chapter">
                <h3 className="products-chapter-title">
                  {this.ML(chapterLabels[chapterId]).toString() ?? chapterId}
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
                              onClick={() => this.handleMediaClick(product)}
                              onTouchStart={(event) =>
                                this.handleMediaTouchStart(product.id, event)
                              }
                              onTouchEnd={(event) =>
                                this.handleMediaTouchEnd(product, event)
                              }
                              aria-label={`Show next photo for ${product.name}`}
                            >
                              <div className="product-media">
                                <img
                                  className="product-photo"
                                  src={
                                    product.photos[
                                      this.getActivePhotoIndex(product)
                                    ]
                                  }
                                  alt={product.name}
                                />
                              </div>
                            </button>
                            <div
                              className="product-photo-dots"
                              aria-label={`${product.name} photos`}
                            >
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
                                    if (
                                      this.hasSyncedPhotoAndVariation(product)
                                    ) {
                                      this.setActiveVariation(
                                        product.id,
                                        index
                                      );
                                    }
                                  }}
                                  aria-label={`Show photo ${index + 1} for ${product.name}`}
                                  aria-pressed={
                                    index === this.getActivePhotoIndex(product)
                                  }
                                />
                              ))}
                            </div>
                          </>
                        ) : (
                          <div className="product-emoji">{product.emoji}</div>
                        )}
                        <div className="product-name">
                          {this.ML(product.name).toString()}
                        </div>
                        <div className="product-desc">
                          {this.ML(product.description).toString()}
                        </div>
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
                        {product.priceVariations &&
                          product.priceVariations.length > 0 && (
                            <ul className="product-price-variations">
                              {(
                                product.priceVariations as ProductPriceVariation[]
                              ).map((variation) => (
                                <li
                                  key={variation.label}
                                  className="product-price-variation-row"
                                >
                                  <button
                                    type="button"
                                    className={
                                      this.getSelectedVariation(product)
                                        ?.label === variation.label
                                        ? 'product-price-variation-button is-active'
                                        : 'product-price-variation-button'
                                    }
                                    onClick={() =>
                                      this.selectVariation(
                                        product,
                                        product.priceVariations?.findIndex(
                                          (candidate) =>
                                            candidate.label === variation.label
                                        ) ?? 0
                                      )
                                    }
                                    aria-label={`Select ${variation.label} option for ${product.name}`}
                                    aria-pressed={
                                      this.getSelectedVariation(product)
                                        ?.label === variation.label
                                    }
                                  >
                                    <span className="product-price-variation-label-group">
                                      <span className="product-price-variation-label">
                                        {(variation.label as string).includes(
                                          'g'
                                        )
                                          ? variation.label
                                          : this.ML(variation.label).toString()}
                                      </span>
                                      {this.shouldShowVariationWeight(
                                        variation
                                      ) && (
                                        <span className="product-price-variation-weight">
                                          {this.formatWeight(
                                            variation.weight,
                                            variation.weightUnit
                                          )}
                                        </span>
                                      )}
                                    </span>
                                    <strong className="product-price-variation-value">
                                      {this.formatPrice(
                                        this.applyWeightDiscount(
                                          product,
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
                            <label
                              className="product-weight-label"
                              htmlFor={`weight-${product.id}`}
                            >
                              {this.ML('Weight (g)').toString()}
                            </label>
                            <input
                              id={`weight-${product.id}`}
                              className={
                                this.state.cheeseWeightErrorByProductId[
                                  product.id
                                ]
                                  ? 'product-weight-input is-invalid'
                                  : 'product-weight-input'
                              }
                              type="number"
                              min="1"
                              step="1"
                              inputMode="numeric"
                              value={
                                this.state.cheeseWeightByProductId[
                                  product.id
                                ] ?? '1000'
                              }
                              onChange={(e) =>
                                this.onCheeseWeightChange(
                                  product.id,
                                  e.target.value
                                )
                              }
                              placeholder={this.ML('Type grams').toString()}
                            />
                            {this.state.cheeseWeightErrorByProductId[
                              product.id
                            ] && (
                              <div className="product-weight-error">
                                {this.ML(
                                  'Weight in grams is required'
                                ).toString()}
                              </div>
                            )}
                          </div>
                        )}
                        <div className="product-footer">
                          <span
                            className="product-price"
                            data-testid={`product-price-${product.id}`}
                          >
                            {this.formatPrice(
                              this.getDisplayedPrice(product),
                              this.getSelectedVariation(product)?.unit ??
                                product.priceUnit
                            )}
                          </span>
                          <button
                            className="add-btn"
                            onClick={() => this.handleAddClick(product)}
                          >
                            {this.ML('Add to basket').toString()}
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
