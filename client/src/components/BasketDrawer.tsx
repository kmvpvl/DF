import React from 'react';
import type {} from '../App';
import { I18nContext, type I18nContextValue } from '../i18n/I18nContext';
import Proto, { IProtoProps, IProtoState } from '../proto';
import { MLString } from '../mlstring';
import { IOrder } from './sections/Orders';
import {} from './sections/Products';

export interface OrderItemPayload {
  productId: string;
  name: string;
  qty: number;
  unitPrice: number;
  lineTotal: number;
  variantLabel?: string;
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

interface BasketDrawerProps extends IProtoProps {
  isOpen: boolean;
  order?: IOrder;
  onClose: () => void;
  onIncreaseQty: (id: string, variantLabel?: string) => void;
  onDecreaseQty: (id: string, variantLabel?: string) => void;
  onRemoveItem: (id: string, variantLabel?: string) => void;
  onSubmitOrder: (payload: OrderPayload) => Promise<void>;
  onPushSubscribe: () => void;
  disableConrols: boolean;
}

interface BasketDrawerState extends IProtoState {
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
    if (
      prevProps.user !== this.props.user ||
      prevProps.isOpen !== this.props.isOpen
    ) {
      this.hydrateCustomerFields();
    }
  }

  private hydrateCustomerFields = () => {
    if (!this.props.user) {
      return;
    }

    this.setState((prevState) => ({
      customerName:
        prevState.customerName ||
        this.props.user?.fullName ||
        this.props.user?.name ||
        '',
      customerEmail: prevState.customerEmail || this.props.user?.email || '',
      customerPhone: prevState.customerPhone || this.props.user?.phone || '',
    }));
  };

  private handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (this.props.order?.products?.length === 0) {
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
        items: [],
        total: 0,
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
        error:
          error instanceof Error ? error.message : 'Failed to place order.',
      });
    }
  };

  render() {
    if (!this.props.isOpen) {
      return null;
    }

    return (
      <div
        className="basket-overlay"
        onClick={(event) =>
          event.target === event.currentTarget && this.props.onClose()
        }
      >
        <aside
          className="basket-drawer"
          role="dialog"
          aria-modal="true"
          aria-label="Basket"
        >
          <div className="basket-header">
            <h2>Basket</h2>
            {this.props.user?.pushSubscription ? (
              <span>Вы подписаны на пуш уведомления</span>
            ) : (
              <button
                onClick={() => {
                  this.props.onPushSubscribe();
                }}
              >
                Subscribe
              </button>
            )}
            <button
              className="modal-close"
              onClick={this.props.onClose}
              aria-label="Close basket"
            >
              x
            </button>
          </div>

          {this.props.order?.products?.length === 0 ? (
            <p className="basket-empty">{this.ML('Your basket is empty')}</p>
          ) : (
            <>
              <ul className="basket-items">
                {this.props.order?.products
                  ?.sort((a, b) => (a.sortOrder ?? 0) - (b.sortOrder ?? 0))
                  .map((item) => {
                    const varName = item.product?.variants.find((v) =>
                      typeof v.label === 'string'
                        ? v.label
                        : v.label.default === item.variantLabel
                    );
                    return (
                      <li
                        key={`${item.productId}-${item.variantLabel ?? 'default'}- none'}`}
                        className="basket-item"
                      >
                        <div className="basket-item-main">
                          <strong>
                            {new MLString(
                              item.product ? item.product.name : 'Loading...'
                            ).toString()}{' '}
                            - {new MLString(varName?.label).toString()}
                          </strong>
                          <span>{this.toCurrency(item.price)}</span>
                        </div>
                        <div className="basket-item-controls">
                          <button
                            type="button"
                            className="basket-qty-btn"
                            onClick={() => {
                              this.props.onDecreaseQty(
                                item.productId,
                                item.variantLabel
                              );
                            }}
                            aria-label={`Decrease quantity for ${item.product ? item.product.name : 'Loading...'}`}
                            disabled={this.props.disableConrols}
                          >
                            -
                          </button>
                          <span className="basket-qty-value">
                            {item.quantity}
                          </span>
                          <button
                            type="button"
                            className="basket-qty-btn"
                            onClick={() => {
                              this.props.onIncreaseQty(
                                item.productId,
                                item.variantLabel
                              );
                            }}
                            aria-label={`Increase quantity for ${item.product ? item.product.name : 'Loading...'}`}
                            disabled={this.props.disableConrols}
                          >
                            +
                          </button>
                          <button
                            type="button"
                            className="basket-remove-btn"
                            onClick={() =>
                              this.props.onRemoveItem(
                                item.productId,
                                item.variantLabel
                              )
                            }
                            disabled={this.props.disableConrols}
                          >
                            Remove
                          </button>
                        </div>
                      </li>
                    );
                  })}
              </ul>

              <div className="basket-total">
                <span>Total</span>
                <strong>{this.toCurrency(this.props.order?.totalPrice)}</strong>
              </div>
            </>
          )}

          <form className="basket-order-form" onSubmit={this.handleSubmit}>
            <input
              className="form-input"
              value={this.state.customerName}
              onChange={(event) =>
                this.setState({ customerName: event.target.value })
              }
              placeholder="Full name"
              required
            />
            <input
              className="form-input"
              type="email"
              value={this.state.customerEmail}
              onChange={(event) =>
                this.setState({ customerEmail: event.target.value })
              }
              placeholder="Email"
              required
            />
            <input
              className="form-input"
              type="tel"
              value={this.state.customerPhone}
              onChange={(event) =>
                this.setState({ customerPhone: event.target.value })
              }
              placeholder="Phone"
              required
            />
            <textarea
              className="form-input"
              value={this.state.note}
              onChange={(event) => this.setState({ note: event.target.value })}
              placeholder="Order note (optional)"
            />

            {this.state.error && (
              <p className="modal-error">{this.state.error}</p>
            )}
            {this.state.sent && (
              <p className="basket-order-success">
                Order sent to sales@dolceforte.rs. We will contact you soon.
              </p>
            )}

            <button
              className="btn-primary"
              type="submit"
              disabled={
                this.state.loading || this.props.order?.products?.length === 0
              }
            >
              {this.state.loading ? 'Sending order...' : 'Place order'}
            </button>
          </form>
        </aside>
      </div>
    );
  }
}

export default BasketDrawer;
