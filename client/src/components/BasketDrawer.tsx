import React from 'react';
import type { BasketItem, User } from '../App';
import { I18nContext, type I18nContextValue } from '../i18n/I18nContext';
import Proto from '../proto';

export interface OrderItemPayload {
  productId: number;
  name: string;
  qty: number;
  unitPrice: number;
  lineTotal: number;
  variationLabel?: string;
  weightGrams?: number;
}

export interface OrderPayload {
  customerName: string;
  customerEmail: string;
  customerPhone: string;
  note?: string;
  items: OrderItemPayload[];
  total: number;
}

interface BasketDrawerProps {
  isOpen: boolean;
  user: User | null;
  items: BasketItem[];
  onClose: () => void;
  onIncreaseQty: (index: number) => void;
  onDecreaseQty: (index: number) => void;
  onRemoveItem: (index: number) => void;
  onSubmitOrder: (payload: OrderPayload) => Promise<void>;
}

interface BasketDrawerState {
  customerName: string;
  customerEmail: string;
  customerPhone: string;
  note: string;
  loading: boolean;
  error: string;
  sent: boolean;
}

class BasketDrawer extends Proto<BasketDrawerProps, BasketDrawerState> {
  static contextType = I18nContext;
  declare context: I18nContextValue | null;

  state: BasketDrawerState = {
    customerName: '',
    customerEmail: '',
    customerPhone: '',
    note: '',
    loading: false,
    error: '',
    sent: false,
  };

  componentDidMount() {
    this.hydrateCustomerFields();
  }

  componentDidUpdate(prevProps: BasketDrawerProps) {
    if (prevProps.user !== this.props.user || prevProps.isOpen !== this.props.isOpen) {
      this.hydrateCustomerFields();
    }
  }

  private hydrateCustomerFields = () => {
    if (!this.props.user) {
      return;
    }

    this.setState((prevState) => ({
      customerName: prevState.customerName || this.props.user?.fullName || this.props.user?.name || '',
      customerEmail: prevState.customerEmail || this.props.user?.email || '',
      customerPhone: prevState.customerPhone || this.props.user?.phone || '',
    }));
  };

  private formatPrice = (value: number) => `${this.toCurrency(value)} din`;

  private getOrderTotal = () =>
    this.props.items.reduce((sum, item) => sum + item.product.price * item.qty, 0);

  private buildOrderItems = (): OrderItemPayload[] =>
    this.props.items.map((item) => ({
      productId: item.product.id,
      name: item.product.name,
      qty: item.qty,
      unitPrice: item.product.price,
      lineTotal: item.product.price * item.qty,
      variationLabel: item.product.selectedVariationLabel,
      weightGrams: item.product.selectedWeightGrams,
    }));

  private handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (this.props.items.length === 0) {
      this.setState({ error: 'Basket is empty.', sent: false });
      return;
    }

    const customerName = this.state.customerName.trim();
    const customerEmail = this.state.customerEmail.trim();
    const customerPhone = this.state.customerPhone.trim();
    const note = this.state.note.trim();

    if (!customerName || !customerEmail || !customerPhone) {
      this.setState({
        error: 'Please fill in name, email and phone before placing an order.',
        sent: false,
      });
      return;
    }

    this.setState({ loading: true, error: '', sent: false });

    try {
      await this.props.onSubmitOrder({
        customerName,
        customerEmail,
        customerPhone,
        note: note || undefined,
        items: this.buildOrderItems(),
        total: this.getOrderTotal(),
      });

      this.setState({
        loading: false,
        error: '',
        sent: true,
        note: '',
      });
    } catch (error: unknown) {
      this.setState({
        loading: false,
        sent: false,
        error: error instanceof Error ? error.message : 'Failed to place order.',
      });
    }
  };

  render() {
    if (!this.props.isOpen) {
      return null;
    }

    const total = this.getOrderTotal();

    return (
      <div
        className="basket-overlay"
        onClick={(event) => event.target === event.currentTarget && this.props.onClose()}
      >
        <aside className="basket-drawer" role="dialog" aria-modal="true" aria-label="Basket">
          <div className="basket-header">
            <h2>Basket</h2>
            <button className="modal-close" onClick={this.props.onClose} aria-label="Close basket">
              x
            </button>
          </div>

          {this.props.items.length === 0 ? (
            <p className="basket-empty">Your basket is empty.</p>
          ) : (
            <>
              <ul className="basket-items">
                {this.props.items.map((item, index) => (
                  <li key={`${item.product.id}-${item.product.selectedVariationLabel ?? 'default'}-${item.product.selectedWeightGrams ?? 'none'}`} className="basket-item">
                    <div className="basket-item-main">
                      <strong>{item.product.name}</strong>
                      <span>{this.formatPrice(item.product.price)}</span>
                    </div>
                    <div className="basket-item-controls">
                      <button
                        type="button"
                        className="basket-qty-btn"
                        onClick={() => this.props.onDecreaseQty(index)}
                        aria-label={`Decrease quantity for ${item.product.name}`}
                      >
                        -
                      </button>
                      <span className="basket-qty-value">{item.qty}</span>
                      <button
                        type="button"
                        className="basket-qty-btn"
                        onClick={() => this.props.onIncreaseQty(index)}
                        aria-label={`Increase quantity for ${item.product.name}`}
                      >
                        +
                      </button>
                      <button
                        type="button"
                        className="basket-remove-btn"
                        onClick={() => this.props.onRemoveItem(index)}
                      >
                        Remove
                      </button>
                    </div>
                  </li>
                ))}
              </ul>

              <div className="basket-total">
                <span>Total</span>
                <strong>{this.formatPrice(total)}</strong>
              </div>
            </>
          )}

          <form className="basket-order-form" onSubmit={this.handleSubmit}>
            <input
              className="form-input"
              value={this.state.customerName}
              onChange={(event) => this.setState({ customerName: event.target.value })}
              placeholder="Full name"
              required
            />
            <input
              className="form-input"
              type="email"
              value={this.state.customerEmail}
              onChange={(event) => this.setState({ customerEmail: event.target.value })}
              placeholder="Email"
              required
            />
            <input
              className="form-input"
              type="tel"
              value={this.state.customerPhone}
              onChange={(event) => this.setState({ customerPhone: event.target.value })}
              placeholder="Phone"
              required
            />
            <textarea
              className="form-input"
              value={this.state.note}
              onChange={(event) => this.setState({ note: event.target.value })}
              placeholder="Order note (optional)"
            />

            {this.state.error && <p className="modal-error">{this.state.error}</p>}
            {this.state.sent && (
              <p className="basket-order-success">
                Order sent to sales@dolceforte.rs. We will contact you soon.
              </p>
            )}

            <button className="btn-primary" type="submit" disabled={this.state.loading || this.props.items.length === 0}>
              {this.state.loading ? 'Sending order...' : 'Place order'}
            </button>
          </form>
        </aside>
      </div>
    );
  }
}

export default BasketDrawer;
