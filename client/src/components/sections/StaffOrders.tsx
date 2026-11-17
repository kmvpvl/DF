import { ReactNode } from 'react';
import Proto, { IProtoProps, IProtoState, } from '../../proto';
import { MLSTRING_FIELDS } from '../../types/gql';
import { IOrder } from './Orders';
import { MLString } from '../../mlstring';

export interface IOrdersProps extends IProtoProps {
}

interface OrderUserOption {
  id: string;
  fullName: string;
}

interface OrderProductOption {
  id: string;
  name: string;
  batchPrefix: string;
}

interface IOrderForm {
  id?: string;
  orderNumber: string;
  orderNumberInt: number;
  customerName: string;
  customerUserId: string;
  orderDate: Date;
  orderDateReady: Date;
  products: {
    id: string;
    orderId: string;
    productId: string;
    quantity: number;
    dateReady: Date;
    createdAt: Date;
    updatedAt: Date;
    sortOrder: number;
  }[];
  createdAt: Date;
  updatedAt: Date;
}

export interface IOrdersState extends IProtoState {
  adding: boolean | null;
  editing: IOrderForm | null;
  loading: boolean;
  searching: boolean;
  saving: boolean;
  generatingId: string | null;
  error: string | null;
  notice: string | null;
  products: OrderProductOption[] | null;
  orders: IOrder[];
  users: OrderUserOption[] | null;

}

const ORDER_FIELDS = `
id
number
numberInt
customerName
customerUserId
orderDate
orderDateReady
status
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
    product {
      name ${MLSTRING_FIELDS}
    }
    price
}
totalPrice
createdAt
updatedAt
`;

const INITIAL_QUERY = `
  query {
    users {
        id
        fullName
    }
    products {
      id
      name ${MLSTRING_FIELDS}
      batchPrefix
    }
    orders {
      ${ORDER_FIELDS}
    }
  }
`;

export default class Orders extends Proto<IOrdersProps, IOrdersState> {
  state: Readonly<IOrdersState> = {
    adding: false,
    editing: null,
    loading: false,
    searching: false,
    saving: false,
    generatingId: null,
    error: null,
    notice: null,
    products: null,
    orders: [],
    users: null,
  };
  componentDidMount(): void {
    this.fetchInitData();
  }

  async fetchInitData() {
    this.setState({ loading: true, error: null, notice: null });
    try {
      const data = await this.gql(INITIAL_QUERY);
      this.setState(prevState=>({
        ...prevState,
        products: data.products as any,
        users: data.users as any,
        orders: data.orders as any,
        loading: false,
      }));
    } catch (error) {
      this.setState({ loading: false, error: String(error) });
    }
  }

  render(): ReactNode {
    const {
      adding,
      editing,
      /*loading,
            searching,
            saving,
            generatingId,*/
      error,
      notice,
      products,
      users,
      orders
    } = this.state;
    return (
      <section className="section tool-page">
        <div className="section-inner tool-page-inner">
          <p className="section-label">Staff</p>
          <h1 className="section-title">Orders</h1>

          {error && <div className="notice error">{error}</div>}
          {notice && <div className="notice success">{notice}</div>}
          {(adding || editing) && (
          <div className="batch-form">
            <h2>Create order</h2>
              <form
                className="material-form"
                onSubmit={(event) => {
                  event.preventDefault();
                  //void this.saveOrder();
                }}
              >
                {adding ? (
                  <>
                    <label className="cj-label">
                      Customer
                      <select
                        className="cj-select"
                        required
                        value={editing?.customerUserId}
                      >
                        <option>
                          {users ? 'Select customer' : 'Not loaded yet'}
                        </option>
                        {users?.map((user) => (
                          <option value={user.id} key={user.id}>
                            {user.fullName}
                          </option>
                        ))}
                      </select>
                    </label>

                    <label className="cj-label">
                      Product
                      <select
                        className="cj-select batch-select"
                        value={''}
                        onChange={() => {
                          //void this.handleCreateProductChange(event.target.value);
                        }}
                        required
                      >
                        <option value="">
                          {products ? 'Select product' : 'Not loaded yet'}
                        </option>
                        {products?.map((product) => (
                          <option key={product.id} value={product.id}>
                            {new MLString(product.name).toString()} ({product.batchPrefix})
                          </option>
                        ))}
                      </select>
                    </label>
                  </>
                ) : (
                  <div className="batch-preview-box"></div>
                )}
              </form>
            </div>
          )}
        <div>
          <h2>Orders</h2>
          <div className="table-responsive">
            <table className="table">
              <thead>
                <tr>
                  <th>#</th>
                  <th>Status</th>
                  <th>Customer</th>
                  <th>Products</th>
                  <th>Total Price</th>
                  <th>Date</th>
                </tr>
              </thead>
              <tbody>
                {orders.map((order) => (
                  <tr key={order.id}>
                    <td>{order.number}</td>
                    <td>
                      <span className={`status-badge status-${order.status.toLowerCase()}`}>
                        {order.status}
                      </span>
                    </td>
                    <td>{order.customerName}</td>
                    <td>
                      <ul className="product-list">
                        {order.products.map((p) => (
                          <li key={p.id}>
                            {new MLString(p.product?.name).toString()} 
                            {p.variantLabel && ` (${p.variantLabel})`} x {p.quantity}
                          </li>
                        ))}
                      </ul>
                    </td>
                    <td>{order.totalPrice ? `${this.toCurrency(order.totalPrice)}`:"-"}</td>
                    <td>{order.createdAt ? new Date(order.createdAt).toLocaleDateString() : '-'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
        </div>
      </section>
    );
  }
}

