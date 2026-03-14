import React from 'react';
import { Product } from '../../App';
import { I18nContext, type I18nContextValue } from '../../i18n/I18nContext';

interface ProductsProps {
  onAddToBasket: (product: Product) => void;
}

class Products extends React.Component<ProductsProps> {
  static contextType = I18nContext;
  declare context: I18nContextValue | null;

  render() {
    const i18n = this.context;
    if (!i18n) {
      throw new Error('Products must be used within I18nProvider');
    }

    const { dictionary } = i18n;
    const products = dictionary.products.items as unknown as Product[];

    return (
      <div id="products" className="products-section">
        <div className="section-inner">
          <p className="section-label">{dictionary.products.label}</p>
          <h2 className="section-title">{dictionary.products.title}</h2>
          <p className="section-desc">{dictionary.products.description}</p>

          <div className="products-grid">
            {products.map(product => (
              <div key={product.id} className="product-card">
                <div className="product-emoji">{product.emoji}</div>
                <div className="product-name">{product.name}</div>
                <div className="product-desc">{product.description}</div>
                <div className="product-footer">
                  <span className="product-price">€{product.price.toFixed(2)}</span>
                  <button
                    className="add-btn"
                    onClick={() => this.props.onAddToBasket(product)}
                  >
                    {dictionary.products.addToBasket}
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }
}

export default Products;
