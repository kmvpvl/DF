import { I18nContext, type I18nContextValue } from '../../i18n/I18nContext';
import Proto from '../../proto';

class Delivery extends Proto<{}, {}> {
  static contextType = I18nContext;
  declare context: I18nContextValue | null;

  render() {
    const i18n = this.context;
    if (!i18n) {
      throw new Error('Delivery must be used within I18nProvider');
    }

    const { dictionary } = i18n;

    return (
      <div id="delivery" className="delivery-section">
        <div className="section-inner">
          <p className="section-label">{this.ML('Delivery').toString()}</p>
          <h2 className="section-title">
            {this.ML('Pickup or Straight to Your Door').toString()}
          </h2>
          <p className="section-desc">
            {this.ML(
              'We handle every detail so your desserts arrive as beautiful as they left our kitchen. Delivery to Pančevo, Belgrade and surrounding areas.'
            ).toString()}
          </p>

          <div className="delivery-cards">
            {dictionary.delivery.cards.map((card) => (
              <div key={card.title} className="delivery-card">
                <div className="delivery-icon">{card.icon}</div>
                <div className="delivery-card-title">{card.title}</div>
                <p className="delivery-card-text">{card.text}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }
}

export default Delivery;
