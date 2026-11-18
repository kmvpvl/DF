import { ReactNode } from 'react';
import Proto, { IProtoProps, IProtoState } from '../../../proto';
import './customer.css';
import { SLIM_PRODUCT_FIELDS } from '../Products';
import { IOrder } from '../Orders';
import { MLString } from '../../../mlstring';

const CUSTOMER_CHAPTERS = ['Orders', 'Conversations', 'Settings'];
const ORDER_QUERY_BY_ID = `
    query order ($orderId: String!){
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
    }`;

export interface ICustomerProps extends IProtoProps {
    chapter?: string;
    objectId?: string;
    onLoginRequired: ()=>void;
    onCloseAuth:()=>void;
}

export interface ICustomerState extends IProtoState {
    chapter: string;
    objectId?: string;
    order?: IOrder | null;
}
export default class Customer extends Proto <ICustomerProps, ICustomerState>{
    state: Readonly<ICustomerState> = {
        chapter: this.props.chapter && CUSTOMER_CHAPTERS.includes(this.props.chapter)?this.props.chapter:CUSTOMER_CHAPTERS[0],
        objectId: this.props.objectId
    }
    async fetchOrder() {
        this.gql(ORDER_QUERY_BY_ID, {orderId: this.props.objectId})
        .then(data=> {
            const order = data.order as any;
            this.setState(prevState=> ({
                ...prevState,
                order
            }));
        });
    }
    componentDidMount(): void {
        if (!this.props.user) this.props.onLoginRequired();
        switch (this.props.chapter) {
            case "Orders": {
                if (this.props.objectId) {

                }
            }
            break
        }
    }
    componentDidUpdate(prevProps: Readonly<ICustomerProps>): void {
        if (!prevProps.user && this.props.user) {
            this.props.onCloseAuth();
            this.fetchOrder();
        }
    }
    render(): ReactNode {
        return (
            <div className='customer-container'>
                <div className="customer-toolbar">
                    <span className='navbar-brand-logo'>
                        <img
                            className="navbar-brand-logo"
                            src="/assets/brand/logos/logo.png"
                            alt="DolceForte"
                        />
                    </span>
                    {CUSTOMER_CHAPTERS.map(chapter=> (
                        <span key={chapter} className={`customer-toolbar-chapter ${chapter === this.state.chapter?'is-active':''}`}>{this.ML(chapter).toString()}</span>
                    ))}
                    <span>{this.props.user?.name}</span>
                </div>
                <div className="customer-content-container">
                    Content
                    {this.state.objectId
                        ?<div className="customer-order-popup-container">
                            <span 
                                className='customer-order-popup-close-button'
                                onClick={()=> {
                                    this.setState(prevState=>({
                                        ...prevState,
                                        objectId: undefined
                                    }))
                                }}
                            >X</span>
                            <span>#{this.state.order?.number} {new Date(this.state.order?.createdAt!).toLocaleDateString()}</span>
                            <span>{this.toCurrency(this.state.order?.totalPrice)}</span>
                            <span>{this.state.order?.deliveryAddress}</span>
                            <div>
                            {this.state.order?.products.sort((a,b)=>(a.sortOrder??0)-(b.sortOrder??0)).map(product=>(
                                <div key={product.id}>
                                    <span>{product.sortOrder}</span>
                                    <span>{new MLString(product.product?.name).toString()}</span>
                                    <span>{product.variantLabel}</span>
                                    <span>{product.quantity}</span>
                                </div>
                            ))}
                            </div>
                        </div>
                        :
                    <></>}
                </div>
                <div className="customer-statusbar">Status</div>
            </div>
        );
    }
}