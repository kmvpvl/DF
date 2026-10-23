import { ReactNode } from 'react';
import Proto, { IProtoProps, IProtoState } from '../../proto';
import { User } from '../../App';
import { MLSTRING_FIELDS } from './StaffProducts';

export interface IOrdersProps extends IProtoProps {
    user: User | null;
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
    orderDate: Date
    orderDateReady: Date;
    products :{
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
    adding: boolean | null,
    editing: IOrderForm | null;
    loading: boolean;
    searching: boolean;
    saving: boolean;
    generatingId: string | null;
    error: string | null;
    notice: string | null;
    products: OrderProductOption[] | null;
    orders: IOrderForm[];
    users: OrderUserOption[] | null;
}

const ORDER_FIELDS = `
id
orderNumber
orderNumberInt
customerName
customerUserId
orderDate
orderDateReady
products {
    id
    orderId
    productId
    quantity
    dateReady
    createdAt
    updatedAt
    sortOrder
}
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
        adding: true,
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
    private setDefaultValues() {
        this.setState((prev: IOrdersState)  => {
            if (!this.props.user) return;
            if (prev.editing?.id == this.props.user.id) return;
            const ret: IOrdersState = {
                ...prev,
                editing: {
                    ...prev.editing,
                    customerUserId: this.props.user.id,
                    customerName: this.props.user.fullName,
                    products:[],
                    createdAt: new Date(),
                    updatedAt: new Date(),
                    orderNumber: "",
                    orderNumberInt: 1,
                    orderDate: new Date(),
                    orderDateReady: new Date()
                }
            }
            return ret;
        })
    }
    componentDidMount(): void {
        this.fetchInitData();
        this.setDefaultValues();
    }

    async fetchInitData() {
        this.setState({loading: true, error: null, notice: null});
        try {
            const data = await this.gql(INITIAL_QUERY);
            this.setState({...this.state, 
                products: data.products as any, 
                users: data.users as any, 
                loading: false
            })

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
            users
        } = this.state;
        return (
        <section className="section tool-page">
            <div className="section-inner tool-page-inner">
                <p className="section-label">Staff</p>
                <h1 className="section-title">Orders</h1>

                {error && <div className="notice error">{error}</div>}
                {notice && <div className="notice success">{notice}</div>}
                <div className="batch-form">
                    <h2>Create order</h2>
                    {(adding || editing) && (
                        <form
                        className="material-form"
                        onSubmit={(event) => {
                            event.preventDefault();
                            //void this.saveOrder();
                        }}
                        >
                        {adding ? (<>
                            <label className="cj-label">
                                Customer
                                <select
                                    className="cj-select"
                                    required
                                    value={editing?.customerUserId}
                                >
                                    <option>{users?'Select customer': 'Not loaded yet'}</option>
                                    {users?.map(user => <option value={user.id} key={user.id}>{user.fullName}</option>)}
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
                                <option value="">{products?'Select product': 'Not loaded yet'}</option>
                                {products?.map((product) => (
                                <option key={product.id} value={product.id}>
                                    {product.name} ({product.batchPrefix})
                                </option>
                                ))}
                            </select>
                            </label>
                        </>) : (
                            <div className="batch-preview-box">
                            </div>
                        )}
                    </form>)}
                </div>
            </div>
        </section>)
    }

}