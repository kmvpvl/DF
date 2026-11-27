import { Fragment } from 'react';
import Proto, { IProtoProps, IProtoState } from '../../proto';
import { MLSTRING_FIELDS } from '../../types/gql';
import { IOrder, OrderStatus } from './Orders';
import { MLString } from '../../mlstring';

interface IOrdersProps extends IProtoProps {
  objectId?: string;
}

type OrderStatusFilter = 'ACTIVE' | 'ALL' | OrderStatus;

const ACTIVE_ORDER_STATUSES = [
  OrderStatus.DRAFT,
  OrderStatus.CONFIRMED,
  OrderStatus.IN_PRODUCTION,
  OrderStatus.READY,
  OrderStatus.SHIPPED,
];

function getLocalDateInputValue(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

function getDefaultDateRange(): { createdFrom: string; createdTo: string } {
  const today = new Date();
  const firstDay = new Date(today);
  firstDay.setDate(firstDay.getDate() - 6);
  return {
    createdFrom: getLocalDateInputValue(firstDay),
    createdTo: getLocalDateInputValue(today),
  };
}

interface IOrdersState extends IProtoState {
  loading: boolean;
  updatingOrderId: string | null;
  cancellingOrderId: string | null;
  expandedOrderId: string | null;
  statusFilter: OrderStatusFilter;
  createdFrom: string;
  createdTo: string;
  customerNameFilter: string;
  customerPhoneFilter: string;
  error: string | null;
  notice: string | null;
  orders: IOrder[];
}

interface OrderNotificationResult {
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

const CANCEL_ORDER_MUTATION = `
  mutation CancelOrder($orderId: ID!) {
    cancelOrder(orderId: $orderId) {
      order {
        id
        status
      }
      emailSent
      pushSent
    }
  }
`;

const MARK_ORDER_READY_MUTATION = `
  mutation MarkOrderReady($orderId: ID!) {
    markOrderReady(orderId: $orderId) {
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
  private readonly defaultDateRange = getDefaultDateRange();

  state: Readonly<IOrdersState> = {
    loading: false,
    updatingOrderId: null,
    cancellingOrderId: null,
    expandedOrderId: this.props.objectId ?? null,
    statusFilter: 'ACTIVE',
    ...this.defaultDateRange,
    customerNameFilter: '',
    customerPhoneFilter: '',
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
      const data = await this.gql<{ orders: IOrder[] }>(ORDERS_QUERY);
      this.setState((previousState) => ({
        orders: data.orders,
        expandedOrderId: this.props.objectId ?? previousState.expandedOrderId,
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
      const data = await this.gql<{
        startOrderProduction: OrderNotificationResult;
      }>(START_ORDER_PRODUCTION_MUTATION, {
        orderId: order.id,
      });
      const result = data.startOrderProduction;
      if (!result?.order?.id) {
        throw new Error(
          this.ML('The server did not return the updated order.')
        );
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
        notice: result.emailSent && result.pushSent ? message : null,
        error: result.emailSent && result.pushSent ? null : message,
      }));
    } catch (error: unknown) {
      this.setState({
        updatingOrderId: null,
        error: error instanceof Error ? error.message : String(error),
      });
    }
  };

  private cancelOrder = async (order: IOrder) => {
    if (!order.id || order.status === OrderStatus.CANCELLED) return;
    if (
      !window.confirm(this.ML('Are you sure you want to cancel this order?'))
    ) {
      return;
    }

    this.setState({
      updatingOrderId: order.id,
      cancellingOrderId: order.id,
      error: null,
      notice: null,
    });
    try {
      const data = await this.gql<{ cancelOrder: OrderNotificationResult }>(
        CANCEL_ORDER_MUTATION,
        {
          orderId: order.id,
        }
      );
      const result = data.cancelOrder;
      if (!result?.order?.id) {
        throw new Error(
          this.ML('The server did not return the updated order.')
        );
      }

      const message = `${this.ML('Order cancelled.')} ${this.ML(
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
        cancellingOrderId: null,
        notice: result.emailSent && result.pushSent ? message : null,
        error: result.emailSent && result.pushSent ? null : message,
      }));
    } catch (error: unknown) {
      this.setState({
        updatingOrderId: null,
        cancellingOrderId: null,
        error: error instanceof Error ? error.message : String(error),
      });
    }
  };

  private markOrderReady = async (order: IOrder) => {
    if (!order.id) return;
    this.setState({
      updatingOrderId: order.id,
      error: null,
      notice: null,
    });
    try {
      const data = await this.gql<{ markOrderReady: OrderNotificationResult }>(
        MARK_ORDER_READY_MUTATION,
        {
          orderId: order.id,
        }
      );
      const result = data.markOrderReady;
      if (!result?.order?.id) {
        throw new Error(
          this.ML('The server did not return the updated order.')
        );
      }

      const message = `${this.ML('Order marked ready.')} ${this.ML(
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
        notice: result.emailSent && result.pushSent ? message : null,
        error: result.emailSent && result.pushSent ? null : message,
      }));
    } catch (error: unknown) {
      this.setState({
        updatingOrderId: null,
        error: error instanceof Error ? error.message : String(error),
      });
    }
  };

  private getVisibleOrders(): IOrder[] {
    const {
      statusFilter,
      createdFrom,
      createdTo,
      customerNameFilter,
      customerPhoneFilter,
      orders,
    } = this.state;
    const customerName = customerNameFilter.trim().toLocaleLowerCase();
    const customerPhone = customerPhoneFilter.trim().toLocaleLowerCase();
    const fromDate = createdFrom ? new Date(`${createdFrom}T00:00:00`) : null;
    const toDate = createdTo ? new Date(`${createdTo}T23:59:59.999`) : null;

    return orders.filter((order) => {
      if (
        statusFilter === 'ACTIVE' &&
        !ACTIVE_ORDER_STATUSES.includes(order.status)
      ) {
        return false;
      }
      if (
        statusFilter !== 'ACTIVE' &&
        statusFilter !== 'ALL' &&
        order.status !== statusFilter
      ) {
        return false;
      }

      if (fromDate || toDate) {
        if (!order.createdAt) return false;
        const createdAt = new Date(order.createdAt);
        if (
          Number.isNaN(createdAt.getTime()) ||
          (fromDate && createdAt < fromDate) ||
          (toDate && createdAt > toDate)
        ) {
          return false;
        }
      }

      if (
        customerName &&
        !order.customerName?.toLocaleLowerCase().includes(customerName)
      ) {
        return false;
      }
      if (
        customerPhone &&
        !order.customerPhone?.toLocaleLowerCase().includes(customerPhone)
      ) {
        return false;
      }
      return true;
    });
  }

  private formatDate(value?: Date | string | null): string {
    return value ? new Date(value).toLocaleString() : '-';
  }

  private toggleOrderDetails = (orderId: string) => {
    this.setState((previousState) => ({
      expandedOrderId:
        previousState.expandedOrderId === orderId ? null : orderId,
    }));
  };

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
                  <tr
                    key={
                      product.id ?? `${product.productId}-${product.sortOrder}`
                    }
                  >
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
    const visibleOrders = this.getVisibleOrders();

    return (
      <section className="section tool-page">
        <div className="section-inner tool-page-inner">
          <p className="section-label">{this.ML('Staff')}</p>
          <h1 className="section-title">{this.ML('Orders')}</h1>

          {error && <div className="notice error">{error}</div>}
          {notice && <div className="notice success">{notice}</div>}
          <div className="staff-orders-filters">
            <label>
              <span>{this.ML('Status')}</span>
              <select
                className="form-input"
                value={this.state.statusFilter}
                onChange={(event) =>
                  this.setState({
                    statusFilter: event.target.value as OrderStatusFilter,
                  })
                }
              >
                <option value="ACTIVE">{this.ML('Active orders')}</option>
                <option value="ALL">{this.ML('All statuses')}</option>
                {Object.values(OrderStatus).map((status) => (
                  <option key={status} value={status}>
                    {this.ML(status)}
                  </option>
                ))}
              </select>
            </label>
            <label>
              <span>{this.ML('Created from')}</span>
              <input
                className="form-input"
                type="date"
                value={this.state.createdFrom}
                onChange={(event) =>
                  this.setState({ createdFrom: event.target.value })
                }
              />
            </label>
            <label>
              <span>{this.ML('Created to')}</span>
              <input
                className="form-input"
                type="date"
                value={this.state.createdTo}
                onChange={(event) =>
                  this.setState({ createdTo: event.target.value })
                }
              />
            </label>
            <label>
              <span>{this.ML('Customer name')}</span>
              <input
                className="form-input"
                type="search"
                value={this.state.customerNameFilter}
                onChange={(event) =>
                  this.setState({ customerNameFilter: event.target.value })
                }
              />
            </label>
            <label>
              <span>{this.ML('Customer phone')}</span>
              <input
                className="form-input"
                type="search"
                value={this.state.customerPhoneFilter}
                onChange={(event) =>
                  this.setState({ customerPhoneFilter: event.target.value })
                }
              />
            </label>
          </div>
          {loading && <p>{this.ML('Loading orders...')}</p>}
          {!loading && orders.length === 0 && (
            <p>{this.ML('No orders are available for this location.')}</p>
          )}
          {!loading && orders.length > 0 && visibleOrders.length === 0 && (
            <p>{this.ML('No orders match the selected filters.')}</p>
          )}

          {visibleOrders.length > 0 && (
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
                  {visibleOrders.map((order, index) => {
                    const orderId = order.id ?? '';
                    const expanded = expandedOrderId === orderId;
                    return (
                      <Fragment key={orderId || order.number || index}>
                        <tr
                          className="staff-order-row"
                          tabIndex={0}
                          aria-label={`${this.ML('Toggle order details')} ${order.number || ''}`}
                          aria-expanded={expanded}
                          aria-controls={`staff-order-details-${orderId}`}
                          onClick={() => this.toggleOrderDetails(orderId)}
                          onKeyDown={(event) => {
                            if (
                              event.target !== event.currentTarget ||
                              (event.key !== 'Enter' && event.key !== ' ')
                            ) {
                              return;
                            }
                            event.preventDefault();
                            this.toggleOrderDetails(orderId);
                          }}
                        >
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
                              {order.status === OrderStatus.CONFIRMED && (
                                <button
                                  type="button"
                                  className="btn-small staff-order-primary"
                                  disabled={
                                    this.state.updatingOrderId === orderId
                                  }
                                  onClick={(event) => {
                                    event.stopPropagation();
                                    void this.startProduction(order);
                                  }}
                                >
                                  {this.state.updatingOrderId === orderId
                                    ? this.ML('Starting production...')
                                    : this.ML('Start production')}
                                </button>
                              )}
                              {order.status === OrderStatus.IN_PRODUCTION && (
                                <button
                                  type="button"
                                  className="btn-small staff-order-primary"
                                  disabled={
                                    this.state.updatingOrderId === orderId
                                  }
                                  onClick={(event) => {
                                    event.stopPropagation();
                                    void this.markOrderReady(order);
                                  }}
                                >
                                  {this.state.updatingOrderId === orderId
                                    ? this.ML('Marking as ready...')
                                    : this.ML('Mark as ready')}
                                </button>
                              )}
                              <button
                                type="button"
                                className="btn-small cj-btn-danger"
                                disabled={
                                  order.status === OrderStatus.CANCELLED ||
                                  this.state.updatingOrderId === orderId
                                }
                                onClick={(event) => {
                                  event.stopPropagation();
                                  void this.cancelOrder(order);
                                }}
                              >
                                {this.state.cancellingOrderId === orderId
                                  ? this.ML('Cancelling order...')
                                  : this.ML('Cancel order')}
                              </button>
                            </div>
                          </td>
                        </tr>
                        {expanded && (
                          <tr>
                            <td colSpan={7}>
                              <div id={`staff-order-details-${orderId}`}>
                                {this.renderOrderDetails(order)}
                              </div>
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
