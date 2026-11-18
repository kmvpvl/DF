import { Fragment } from 'react';
import Proto, { IProtoProps, IProtoState } from '../../proto';
import { MLSTRING_FIELDS } from '../../types/gql';
import { IOrder, OrderStatus } from './Orders';
import { MLString } from '../../mlstring';

interface IOrdersProps extends IProtoProps {
  objectId?: string;
}

interface IOrdersState extends IProtoState {
  loading: boolean;
  updatingOrderId: string | null;
  expandedOrderId: string | null;
  error: string | null;
  notice: string | null;
  orders: IOrder[];
}

interface OrderAcceptanceResult {
  order: Pick<IOrder, 'id' | 'status'>;
  emailSent: boolean;
  pushSent: boolean;
}

const ORDERS_QUERY = `
  query LocationOrders {
    orders {
      id
      number
      numberInt
      customerName
      customerUserId
      customerEmail
      customerPhone
      orderDate
      orderDateReady
      status
      totalPrice
      deliveryFee
      deliveryLocation
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
          name ${MLSTRING_FIELDS}
        }
      }
    }
  }
`;

const START_ORDER_PRODUCTION_MUTATION = `
  mutation StartOrderProduction($orderId: ID!) {
    startOrderProduction(orderId: $orderId) {
      order {
        id
        status
      }
      emailSent
      pushSent
    }
  }
`;

export default class StaffOrders extends Proto<IOrdersProps, IOrdersState> {
  state: Readonly<IOrdersState> = {
    loading: false,
    updatingOrderId: null,
    expandedOrderId: this.props.objectId ?? null,
    error: null,
    notice: null,
    orders: [],
  };

  componentDidMount(): void {
    void this.fetchOrders();
  }

  componentDidUpdate(previousProps: IOrdersProps): void {
    if (previousProps.objectId !== this.props.objectId) {
      this.setState({ expandedOrderId: this.props.objectId ?? null });
    }
  }

  private fetchOrders = async () => {
    this.setState({ loading: true, error: null, notice: null });
    try {
      const data = await this.gql(ORDERS_QUERY);
      this.setState((previousState) => ({
        orders: data.orders as IOrder[],
        expandedOrderId:
          this.props.objectId ?? previousState.expandedOrderId,
        loading: false,
      }));
    } catch (error: unknown) {
      this.setState({
        loading: false,
        error: error instanceof Error ? error.message : String(error),
      });
    }
  };

  private startProduction = async (order: IOrder) => {
    if (!order.id) return;
    this.setState({
      updatingOrderId: order.id,
      error: null,
      notice: null,
    });
    try {
      const data = await this.gql(START_ORDER_PRODUCTION_MUTATION, {
        orderId: order.id,
      });
      const result = data.startOrderProduction as OrderAcceptanceResult;
      if (!result?.order?.id) {
        throw new Error(this.ML('The server did not return the updated order.'));
      }

      const message = `${this.ML('Order moved to production.')} ${this.ML(
        'Email'
      )}: ${this.ML(result.emailSent ? 'sent' : 'failed')}; ${this.ML(
        'Push'
      )}: ${this.ML(result.pushSent ? 'sent' : 'failed')}.`;
      this.setState((previousState) => ({
        orders: previousState.orders.map((existingOrder) =>
          existingOrder.id === result.order.id
            ? { ...existingOrder, status: result.order.status }
            : existingOrder
        ),
        updatingOrderId: null,
        notice:
          result.emailSent && result.pushSent ? message : null,
        error:
          result.emailSent && result.pushSent ? null : message,
      }));
    } catch (error: unknown) {
      this.setState({
        updatingOrderId: null,
        error: error instanceof Error ? error.message : String(error),
      });
    }
  };

  private formatDate(value?: Date | string | null): string {
    return value ? new Date(value).toLocaleString() : '-';
  }

  private renderOrderDetails(order: IOrder) {
    const coordinates = order.deliveryLocation;

    return (
      <section className="staff-order-details">
        <div className="staff-order-details-grid">
          <dl>
            <div>
              <dt>{this.ML('Customer')}</dt>
              <dd>{order.customerName || '-'}</dd>
            </div>
            <div>
              <dt>{this.ML('Email')}</dt>
              <dd>
                {order.customerEmail ? (
                  <a href={`mailto:${order.customerEmail}`}>
                    {order.customerEmail}
                  </a>
                ) : (
                  '-'
                )}
              </dd>
            </div>
            <div>
              <dt>{this.ML('Phone')}</dt>
              <dd>
                {order.customerPhone ? (
                  <a href={`tel:${order.customerPhone}`}>
                    {order.customerPhone}
                  </a>
                ) : (
                  '-'
                )}
              </dd>
            </div>
            <div>
              <dt>{this.ML('Delivery address')}</dt>
              <dd>{order.deliveryAddress || '-'}</dd>
            </div>
            <div>
              <dt>{this.ML('Delivery coordinates')}</dt>
              <dd>
                {typeof coordinates?.lat === 'number' &&
                typeof coordinates.lon === 'number'
                  ? `${coordinates.lat}, ${coordinates.lon}`
                  : '-'}
              </dd>
            </div>
            <div>
              <dt>{this.ML('Shipping method')}</dt>
              <dd>{order.shippingMethod || '-'}</dd>
            </div>
            <div>
              <dt>{this.ML('Tracking number')}</dt>
              <dd>{order.trackingNumber || '-'}</dd>
            </div>
          </dl>
          <dl>
            <div>
              <dt>{this.ML('Order date')}</dt>
              <dd>{this.formatDate(order.orderDate)}</dd>
            </div>
            <div>
              <dt>{this.ML('Ready date')}</dt>
              <dd>{this.formatDate(order.orderDateReady)}</dd>
            </div>
            <div>
              <dt>{this.ML('Created')}</dt>
              <dd>{this.formatDate(order.createdAt)}</dd>
            </div>
            <div>
              <dt>{this.ML('Updated')}</dt>
              <dd>{this.formatDate(order.updatedAt)}</dd>
            </div>
            <div>
              <dt>{this.ML('Paid')}</dt>
              <dd>{this.ML(order.isPaid ? 'Yes' : 'No')}</dd>
            </div>
            <div>
              <dt>{this.ML('Payment method')}</dt>
              <dd>{order.paymentMethod || '-'}</dd>
            </div>
            <div>
              <dt>{this.ML('Delivery fee')}</dt>
              <dd>{this.toCurrency(order.deliveryFee)}</dd>
            </div>
            <div>
              <dt>{this.ML('Total')}</dt>
              <dd>{this.toCurrency(order.totalPrice)}</dd>
            </div>
            <div>
              <dt>{this.ML('Customer note')}</dt>
              <dd>{order.notes || '-'}</dd>
            </div>
          </dl>
        </div>

        <h3>{this.ML('Products')}</h3>
        <div className="cj-table">
          <table className="table staff-order-products">
            <thead>
              <tr>
                <th>{this.ML('Product')}</th>
                <th>{this.ML('Variant')}</th>
                <th>{this.ML('Quantity')}</th>
                <th>{this.ML('Unit price')}</th>
                <th>{this.ML('Line total')}</th>
              </tr>
            </thead>
            <tbody>
              {order.products.map((product) => {
                const lineTotal = product.price ?? 0;
                const unitPrice =
                  product.quantity > 0
                    ? lineTotal / product.quantity
                    : undefined;
                return (
                  <tr key={product.id ?? `${product.productId}-${product.sortOrder}`}>
                    <td>{new MLString(product.product?.name).toString()}</td>
                    <td>{product.variantLabel || '-'}</td>
                    <td>{product.quantity}</td>
                    <td>{this.toCurrency(unitPrice)}</td>
                    <td>{this.toCurrency(lineTotal)}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </section>
    );
  }

  render() {
    const { error, loading, notice, orders, expandedOrderId } = this.state;

    return (
      <section className="section tool-page">
        <div className="section-inner tool-page-inner">
          <p className="section-label">{this.ML('Staff')}</p>
          <h1 className="section-title">{this.ML('Orders')}</h1>

          {error && <div className="notice error">{error}</div>}
          {notice && <div className="notice success">{notice}</div>}
          {loading && <p>{this.ML('Loading orders...')}</p>}
          {!loading && orders.length === 0 && (
            <p>{this.ML('No orders are available for this location.')}</p>
          )}

          {orders.length > 0 && (
            <div className="cj-table">
              <table className="table">
                <thead>
                  <tr>
                    <th>#</th>
                    <th>{this.ML('Status')}</th>
                    <th>{this.ML('Customer')}</th>
                    <th>{this.ML('Products')}</th>
                    <th>{this.ML('Total')}</th>
                    <th>{this.ML('Created')}</th>
                    <th>{this.ML('Actions')}</th>
                  </tr>
                </thead>
                <tbody>
                  {orders.map((order, index) => {
                    const orderId = order.id ?? '';
                    const expanded = expandedOrderId === orderId;
                    return (
                      <Fragment key={orderId || order.number || index}>
                        <tr>
                          <td>{order.number || '-'}</td>
                          <td>
                            <span
                              className={`status-badge status-${order.status.toLowerCase()}`}
                            >
                              {this.ML(order.status)}
                            </span>
                          </td>
                          <td>{order.customerName || '-'}</td>
                          <td>
                            <ul className="product-list">
                              {order.products.map((product) => (
                                <li key={product.id ?? product.productId}>
                                  {new MLString(
                                    product.product?.name
                                  ).toString()}
                                  {product.variantLabel
                                    ? ` (${product.variantLabel})`
                                    : ''}{' '}
                                  x {product.quantity}
                                </li>
                              ))}
                            </ul>
                          </td>
                          <td>{this.toCurrency(order.totalPrice)}</td>
                          <td>{this.formatDate(order.createdAt)}</td>
                          <td>
                            <div className="staff-order-actions">
                              <button
                                type="button"
                                className="btn-secondary"
                                aria-expanded={expanded}
                                onClick={() =>
                                  this.setState({
                                    expandedOrderId: expanded
                                      ? null
                                      : orderId,
                                  })
                                }
                              >
                                {this.ML(
                                  expanded ? 'Hide details' : 'View details'
                                )}
                              </button>
                              {order.status === OrderStatus.CONFIRMED && (
                                <button
                                  type="button"
                                  className="btn-primary"
                                  disabled={
                                    this.state.updatingOrderId === orderId
                                  }
                                  onClick={() =>
                                    void this.startProduction(order)
                                  }
                                >
                                  {this.state.updatingOrderId === orderId
                                    ? this.ML('Starting production...')
                                    : this.ML('Start production')}
                                </button>
                              )}
                            </div>
                          </td>
                        </tr>
                        {expanded && (
                          <tr>
                            <td colSpan={7}>
                              {this.renderOrderDetails(order)}
                            </td>
                          </tr>
                        )}
                      </Fragment>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </section>
    );
  }
}
