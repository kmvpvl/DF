import Proto, { IProtoProps, IProtoState } from '../../../proto';
import './customer.css';
import { SLIM_PRODUCT_FIELDS } from '../Products';
import { IOrder } from '../Orders';
import { MLString } from '../../../mlstring';

const CUSTOMER_CHAPTERS = ['Orders', 'Conversations', 'Settings'];
const ORDER_QUERY_BY_ID = `
  query order ($orderId: String!) {
    order (orderId: $orderId) {
      id
      number
      numberInt
      customerName
      customerUserId
      orderDate
      orderDateReady
      status
      totalPrice
      deliveryFee
      isPaid
      paymentMethod
      deliveryAddress
      shippingMethod
      trackingNumber
      managerId
      notes
      createdAt
      updatedAt
      locationId
      products {
        id
        orderId
        productId
        quantity
        dateReady
        createdAt
        updatedAt
        sortOrder
        variantLabel
        price
        product {
          ${SLIM_PRODUCT_FIELDS}
        }
      }
    }
  }
`;

export interface ICustomerProps extends IProtoProps {
  chapter?: string;
  objectId?: string;
  onLoginRequired: () => void;
  onCloseAuth: () => void;
}

export interface ICustomerState extends IProtoState {
  chapter: string;
  objectId?: string;
  order: IOrder | null;
  isOrderLoading: boolean;
  orderError: string;
}

export default class Customer extends Proto<ICustomerProps, ICustomerState> {
  private orderRequestId = 0;

  state: Readonly<ICustomerState> = {
    chapter: this.getChapterFromProps(),
    objectId: this.props.objectId,
    order: null,
    isOrderLoading: false,
    orderError: '',
  };

  componentDidMount() {
    if (!this.props.user) {
      this.props.onLoginRequired();
      return;
    }
    this.loadOrderForCurrentRoute();
  }

  componentDidUpdate(prevProps: Readonly<ICustomerProps>) {
    const userChanged = prevProps.user?.id !== this.props.user?.id;
    const routeChanged =
      prevProps.chapter !== this.props.chapter ||
      prevProps.objectId !== this.props.objectId;

    if (!prevProps.user && this.props.user) {
      this.props.onCloseAuth();
    }

    if (routeChanged) {
      this.orderRequestId += 1;
      this.setState({
        chapter: this.getChapterFromProps(),
        objectId: this.props.objectId,
        order: null,
        isOrderLoading: false,
        orderError: '',
      });
    }

    if (userChanged && !this.props.user) {
      this.orderRequestId += 1;
      this.setState({ order: null, isOrderLoading: false, orderError: '' });
      return;
    }

    if (userChanged || routeChanged) {
      this.loadOrderForCurrentRoute();
    }
  }

  componentWillUnmount() {
    this.orderRequestId += 1;
  }

  private getChapterFromProps() {
    return this.props.chapter && CUSTOMER_CHAPTERS.includes(this.props.chapter)
      ? this.props.chapter
      : CUSTOMER_CHAPTERS[0];
  }

  private loadOrderForCurrentRoute = () => {
    const chapter = this.getChapterFromProps();
    if (this.props.user && chapter === 'Orders' && this.props.objectId) {
      void this.fetchOrder(this.props.objectId);
    }
  };

  private fetchOrder = async (orderId: string) => {
    const requestId = ++this.orderRequestId;
    this.setState({
      order: null,
      isOrderLoading: true,
      orderError: '',
    });

    try {
      const data = await this.gql<{ order: IOrder | null }>(ORDER_QUERY_BY_ID, { orderId });
      if (requestId !== this.orderRequestId) return;
      this.setState({
        order: data.order ?? null,
        isOrderLoading: false,
      });
    } catch (error: unknown) {
      if (requestId !== this.orderRequestId) return;
      this.setState({
        order: null,
        isOrderLoading: false,
        orderError:
          error instanceof Error ? error.message : this.ML('Failed to load order'),
      });
    }
  };

  private closeOrderDetails = () => {
    const path = `/customer/${this.state.chapter}`;
    if (window.location.pathname !== path) {
      window.history.pushState({}, '', path);
    }
    this.orderRequestId += 1;
    this.setState({
      objectId: undefined,
      order: null,
      isOrderLoading: false,
      orderError: '',
    });
  };

  private renderOrderDetails() {
    const order = this.state.order;
    const orderNumber = order?.number ?? String(order?.numberInt ?? '');
    const orderDate = order?.createdAt ? new Date(order.createdAt) : null;
    const sortedProducts = [...(order?.products ?? [])].sort(
      (a, b) => (a.sortOrder ?? 0) - (b.sortOrder ?? 0)
    );

    return (
      <section
        className="customer-order-popup-container"
        aria-label={this.ML('Order details')}
      >
        <header className="customer-order-header">
          <div>
            <p className="customer-order-eyebrow">
              {this.ML('Order details')}
            </p>
            {order && (
              <h1 className="customer-order-title">
                {this.ML('Order')} {orderNumber && `#${orderNumber}`}
              </h1>
            )}
            {orderDate && !Number.isNaN(orderDate.getTime()) && (
              <p className="customer-order-date">
                {this.ML('Order date')}:{' '}
                <time dateTime={orderDate.toISOString()}>
                  {orderDate.toLocaleDateString(this.getLanguage())}
                </time>
              </p>
            )}
          </div>
          <button
            type="button"
            className="customer-order-popup-close-button"
            aria-label={this.ML('Close order details')}
            onClick={this.closeOrderDetails}
          >
            ×
          </button>
        </header>

        {this.state.isOrderLoading ? (
          <p className="customer-order-message" aria-live="polite">
            {this.ML('Loading order...')}
          </p>
        ) : this.state.orderError ? (
          <p className="customer-order-message customer-order-error" role="alert">
            {this.state.orderError}
          </p>
        ) : !order ? (
          <p className="customer-order-message">{this.ML('Order not found')}</p>
        ) : (
          <>
            <div className="customer-order-meta">
              <span
                className={`customer-order-status customer-order-status--${order.status.toLowerCase()}`}
              >
                {this.ML(order.status)}
              </span>
            </div>

            <ul className="basket-items customer-order-items">
              {sortedProducts.map((item) => {
                const variant = item.product?.variants.find((productVariant) =>
                  typeof productVariant.label === 'string'
                    ? productVariant.label === item.variantLabel
                    : productVariant.label.default === item.variantLabel
                );
                const variantLabel = variant?.label
                  ? new MLString(variant.label).toString()
                  : item.variantLabel;
                const unitPrice =
                  item.price !== undefined && item.quantity > 0
                    ? item.price / item.quantity
                    : null;

                return (
                  <li
                    className="basket-item customer-order-item"
                    key={item.id ?? `${item.productId}-${item.variantLabel}`}
                  >
                    <div className="basket-item-main">
                      <div className="customer-order-product-name">
                        <strong>
                          {new MLString(
                            item.product?.name ?? this.ML('Product unavailable')
                          ).toString()}
                        </strong>
                        {variantLabel && (
                          <span>{new MLString(variantLabel).toString()}</span>
                        )}
                      </div>
                      <strong>{this.toCurrency(item.price)}</strong>
                    </div>
                    <div className="customer-order-item-meta">
                      <span>
                        {this.ML('Quantity')}: <strong>{item.quantity}</strong>
                      </span>
                      {unitPrice !== null && (
                        <span>
                          {this.ML('Unit price')}:{' '}
                          <strong>{this.toCurrency(unitPrice)}</strong>
                        </span>
                      )}
                    </div>
                  </li>
                );
              })}
            </ul>

            <div className="basket-total customer-order-total">
              <span>{this.ML('Total')}</span>
              <strong>{this.toCurrency(order.totalPrice)}</strong>
            </div>

            <dl className="customer-order-info">
              <div>
                <dt>{this.ML('Delivery')}</dt>
                <dd>{this.toCurrency(order.deliveryFee)}</dd>
              </div>
              <div>
                <dt>{this.ML('Delivery address')}</dt>
                <dd>{order.deliveryAddress || '—'}</dd>
              </div>
              {order.shippingMethod && (
                <div>
                  <dt>{this.ML('Shipping method')}</dt>
                  <dd>{order.shippingMethod}</dd>
                </div>
              )}
              {order.paymentMethod && (
                <div>
                  <dt>{this.ML('Payment method')}</dt>
                  <dd>{order.paymentMethod}</dd>
                </div>
              )}
              {order.trackingNumber && (
                <div>
                  <dt>{this.ML('Tracking number')}</dt>
                  <dd>{order.trackingNumber}</dd>
                </div>
              )}
            </dl>
          </>
        )}
      </section>
    );
  }

  render() {
    return (
      <div className="customer-container">
        <div className="customer-toolbar">
          <span className="navbar-brand-logo">
            <img
              className="navbar-brand-logo"
              src="/assets/brand/logos/logo.png"
              alt="DolceForte"
            />
          </span>
          {CUSTOMER_CHAPTERS.map((chapter) => (
            <span
              key={chapter}
              className={`customer-toolbar-chapter ${chapter === this.state.chapter ? 'is-active' : ''}`}
            >
              {this.ML(chapter)}
            </span>
          ))}
          <span>{this.props.user?.name}</span>
        </div>
        <main className="customer-content-container">
          {this.props.user &&
            this.state.chapter === 'Orders' &&
            this.state.objectId &&
            this.renderOrderDetails()}
        </main>
      </div>
    );
  }
}
