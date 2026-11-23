import Proto, { IProtoProps, IProtoState } from '../../proto';
import { DeliveryRules } from '../deliveryRules/deliveryRules';

interface DeliveryProps extends IProtoProps {}
interface DeliveryState extends IProtoState {
  showDeliveryRules?: boolean;
}

class Delivery extends Proto<DeliveryProps, DeliveryState> {
  render() {
    const i18n = this.context;
    if (!i18n) {
      throw new Error('Delivery must be used within I18nProvider');
    }

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
            <div key={1} className="delivery-card">
              <div className="delivery-icon">🚀</div>
              <div className="delivery-card-title">
                {this.ML(
                  'We will deliver any order within 24 hours'
                ).toString()}
              </div>
              <p className="delivery-card-text">
                {this.ML(
                  'If only items that are in stock are ordered, the order will be delivered within 2 hours'
                ).toString()}
              </p>
            </div>
            <div key={2} className="delivery-card">
              <div className="delivery-icon">🏠</div>
              <div className="delivery-card-title">
                {this.ML(
                  'We automatically calculate the shipping cost'
                ).toString()}
              </div>
              <p className="delivery-card-text">
                {this.ML(
                  'When placing an order, the delivery cost will be shown as a separate line item. The cost is calculated as 200 dinars plus 50 dinars for every kilometer.'
                ).toString()}
              </p>
            </div>
            <div
              key={3}
              className="delivery-card"
              onClick={() => {
                this.setState({ showDeliveryRules: true });
              }}
            >
              <div className="delivery-icon">📃</div>
              <div className="delivery-card-title">
                {this.ML('Review the delivery terms and conditions').toString()}
              </div>
              <p className="delivery-card-text">
                {this.ML(
                  'Click to view the full delivery terms and conditions'
                ).toString()}
              </p>
            </div>
          </div>
        </div>
        {this.state.showDeliveryRules && (
          <DeliveryRules
            onClose={() => {
              this.setState({ showDeliveryRules: false });
            }}
          />
        )}
      </div>
    );
  }
}

export default Delivery;
