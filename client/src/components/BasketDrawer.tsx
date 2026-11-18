import React from 'react';
import type {} from '../App';
import { I18nContext, type I18nContextValue } from '../i18n/I18nContext';
import Proto, { IProtoProps, IProtoState } from '../proto';
import { MLString } from '../mlstring';
import { IOrder } from './sections/Orders';
import {} from './sections/Products';
import PushNotificationControl from './PushNotificationControl';

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
  customerDeliveryAddress: string;
  deliveryLat: number;
  deliveryLon: number;
  customerPhone: string;
  note?: string;
  items: OrderItemPayload[];
  total: number;
}

interface AddressSuggestion {
  formatted: string;
  lat: number;
  lon: number;
  isExactHouse: boolean;
}

interface VerifiedDeliveryAddress extends RouteEstimate {
  address: string;
  lat: number;
  lon: number;
}

interface RouteEstimate {
  distanceMeters: number;
  durationSeconds: number;
  isValidAddress: boolean;
  deliveryCost: number | null;
  currencySymbol: string;
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
  customerDeliveryAddress: string;
  addressSuggestions: AddressSuggestion[];
  selectedAddress: AddressSuggestion | null;
  addressSearchLoading: boolean;
  addressSearchError: string;
  savedAddressLoading: boolean;
  routeEstimate: RouteEstimate | null;
  routeEstimateLoading: boolean;
  routeEstimateError: string;
  selectedAddressRequiresVerification: boolean;
  note: string;
  loading: boolean;
  error: string;
  sent: boolean;
}

class BasketDrawer extends Proto<BasketDrawerProps, BasketDrawerState> {
  static contextType = I18nContext;
  declare context: I18nContextValue | null;
  private addressSearchTimeoutId: ReturnType<typeof setTimeout> | null = null;
  private addressSearchRequestId = 0;
  private savedAddressRequestId = 0;
  private loadedSavedAddressUserId: string | null = null;
  private routeEstimateRequestId = 0;

  state: BasketDrawerState = {
    customerName: '',
    customerEmail: '',
    customerPhone: '',
    customerDeliveryAddress: this.props.user?.deliveryAddress ?? '',
    addressSuggestions: [],
    selectedAddress: null,
    addressSearchLoading: false,
    addressSearchError: '',
    savedAddressLoading: false,
    routeEstimate: null,
    routeEstimateLoading: false,
    routeEstimateError: '',
    selectedAddressRequiresVerification: false,
    note: '',
    loading: false,
    error: '',
    sent: false,
  };

  componentDidMount() {
    this.hydrateCustomerFields();
    if (this.props.user) {
      void this.loadVerifiedDeliveryAddress();
    }
  }

  componentWillUnmount() {
    if (this.addressSearchTimeoutId) {
      clearTimeout(this.addressSearchTimeoutId);
    }
    this.addressSearchRequestId += 1;
    this.savedAddressRequestId += 1;
    this.routeEstimateRequestId += 1;
  }

  componentDidUpdate(prevProps: BasketDrawerProps) {
    if (
      prevProps.user !== this.props.user ||
      prevProps.isOpen !== this.props.isOpen
    ) {
      this.hydrateCustomerFields();
    }
    const userChanged = prevProps.user?.id !== this.props.user?.id;
    const drawerOpened = !prevProps.isOpen && this.props.isOpen;
    if (this.props.user && (userChanged || drawerOpened)) {
      if (drawerOpened && !userChanged) {
        this.loadedSavedAddressUserId = null;
      }
      void this.loadVerifiedDeliveryAddress();
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
      customerDeliveryAddress:
        prevState.customerDeliveryAddress ||
        this.props.user?.deliveryAddress ||
        '',
    }));
  };

  private loadVerifiedDeliveryAddress = async () => {
    const user = this.props.user;
    if (!user || this.loadedSavedAddressUserId === user.id) return;

    this.loadedSavedAddressUserId = user.id;
    const requestId = ++this.savedAddressRequestId;
    this.setState({ savedAddressLoading: true, addressSearchError: '' });
    try {
      const data = await this.gql(`
        query MyVerifiedDeliveryAddress {
          myVerifiedDeliveryAddress {
            address
            lat
            lon
            distanceMeters
            durationSeconds
            isValidAddress
            deliveryCost
            currencySymbol
          }
        }
      `);
      if (requestId !== this.savedAddressRequestId) return;

      const saved =
        data.myVerifiedDeliveryAddress as VerifiedDeliveryAddress | null;
      if (!saved) {
        this.setState({ savedAddressLoading: false }, () => {
          if (
            this.props.isOpen &&
            !this.state.selectedAddress &&
            this.state.customerDeliveryAddress.trim().length >= 3
          ) {
            this.scheduleAddressSearch(this.state.customerDeliveryAddress);
          }
        });
        return;
      }

      const address: AddressSuggestion = {
        formatted: saved.address,
        lat: saved.lat,
        lon: saved.lon,
        isExactHouse: true,
      };
      const routeEstimate: RouteEstimate = {
        distanceMeters: saved.distanceMeters,
        durationSeconds: saved.durationSeconds,
        isValidAddress: saved.isValidAddress,
        deliveryCost: saved.deliveryCost,
        currencySymbol: saved.currencySymbol,
      };
      this.setState((prevState) => {
        const canRestoreAddress =
          !prevState.customerDeliveryAddress ||
          prevState.customerDeliveryAddress === user.deliveryAddress;
        const shouldRestoreAddress =
          canRestoreAddress && !prevState.selectedAddress;
        return {
          savedAddressLoading: false,
          customerDeliveryAddress: shouldRestoreAddress
            ? address.formatted
            : prevState.customerDeliveryAddress,
          selectedAddress: shouldRestoreAddress
            ? address
            : prevState.selectedAddress,
          selectedAddressRequiresVerification: shouldRestoreAddress
            ? false
            : prevState.selectedAddressRequiresVerification,
          routeEstimate: shouldRestoreAddress
            ? routeEstimate
            : prevState.routeEstimate,
        };
      });
    } catch (error: unknown) {
      if (requestId !== this.savedAddressRequestId) return;
      this.loadedSavedAddressUserId = null;
      this.setState({
        savedAddressLoading: false,
        addressSearchError:
          error instanceof Error
            ? error.message
            : 'Could not load the saved delivery address.',
      });
    }
  };

  private scheduleAddressSearch = (query: string) => {
    if (this.addressSearchTimeoutId) {
      clearTimeout(this.addressSearchTimeoutId);
      this.addressSearchTimeoutId = null;
    }

    const requestId = ++this.addressSearchRequestId;
    this.savedAddressRequestId += 1;
    const trimmedQuery = query.trim();
    this.setState({
      customerDeliveryAddress: query,
      addressSuggestions: [],
      selectedAddress: null,
      addressSearchLoading: false,
      addressSearchError: '',
      savedAddressLoading: false,
      routeEstimate: null,
      routeEstimateLoading: false,
      routeEstimateError: '',
      selectedAddressRequiresVerification: false,
    });
    this.routeEstimateRequestId += 1;

    if (trimmedQuery.length < 3) return;

    this.addressSearchTimeoutId = setTimeout(() => {
      void this.fetchAddressSuggestions(trimmedQuery, requestId);
    }, 350);
  };

  private fetchAddressSuggestions = async (
    query: string,
    requestId: number
  ) => {
    this.setState({ addressSearchLoading: true, addressSearchError: '' });
    try {
      const data = await this.gql(
        `query SearchAddress($query: String!) {
          searchAddress(query: $query) {
            formatted
            lat
            lon
            isExactHouse
          }
        }`,
        { query }
      );
      if (requestId !== this.addressSearchRequestId) return;
      const suggestions = data.searchAddress as AddressSuggestion[];
      this.setState({
        addressSuggestions: suggestions,
        addressSearchLoading: false,
      }, () => {
        if (
          requestId === this.addressSearchRequestId &&
          suggestions.length === 1 &&
          suggestions[0].isExactHouse
        ) {
          void this.selectAddress(suggestions[0]);
        }
      });
    } catch (error: unknown) {
      if (requestId !== this.addressSearchRequestId) return;
      this.setState({
        addressSearchLoading: false,
        addressSearchError:
          error instanceof Error ? error.message : 'Address search failed.',
      });
    }
  };

  private selectAddress = async (address: AddressSuggestion) => {
    if (!address.isExactHouse) return;
    if (this.addressSearchTimeoutId) {
      clearTimeout(this.addressSearchTimeoutId);
      this.addressSearchTimeoutId = null;
    }

    this.addressSearchRequestId += 1;
    this.savedAddressRequestId += 1;
    this.setState({
      customerDeliveryAddress: address.formatted,
      addressSuggestions: [],
      selectedAddress: address,
      addressSearchLoading: false,
      addressSearchError: '',
      routeEstimate: null,
      routeEstimateLoading: true,
      routeEstimateError: '',
      selectedAddressRequiresVerification: true,
    });

    await this.requestRouteEstimate(address, true);
  };

  private requestRouteEstimate = async (
    address: AddressSuggestion,
    verifyAddress: boolean
  ) => {
    const requestId = ++this.routeEstimateRequestId;
    this.setState({
      routeEstimate: null,
      routeEstimateLoading: true,
      routeEstimateError: '',
      selectedAddressRequiresVerification: verifyAddress,
    });
    try {
      const data = await this.gql(
        verifyAddress
          ? `mutation VerifyDeliveryAddress($address: String!, $lat: Float!, $lon: Float!) {
                verifyDeliveryAddress(address: $address, lat: $lat, lon: $lon) {
                  distanceMeters
                  durationSeconds
                  isValidAddress
                  deliveryCost
                  currencySymbol
                }
              }`
          : `query EstimateDelivery($lat: Float!, $lon: Float!) {
                estimateDelivery(lat: $lat, lon: $lon) {
                  distanceMeters
                  durationSeconds
                  isValidAddress
                  deliveryCost
                  currencySymbol
                }
              }`,
        verifyAddress
          ? { address: address.formatted, lat: address.lat, lon: address.lon }
          : { lat: address.lat, lon: address.lon }
      );
      if (requestId !== this.routeEstimateRequestId) return;
      this.setState({
        routeEstimate: (verifyAddress
          ? data.verifyDeliveryAddress
          : data.estimateDelivery) as RouteEstimate,
        routeEstimateLoading: false,
        selectedAddressRequiresVerification: false,
      });
    } catch (error: unknown) {
      if (requestId !== this.routeEstimateRequestId) return;
      this.setState({
        routeEstimateLoading: false,
        routeEstimateError:
          error instanceof Error
            ? error.message
            : 'Could not calculate the delivery route.',
      });
    }
  };

  private handleAddressFocus = () => {
    if (this.state.savedAddressLoading) return;
    if (this.state.selectedAddress) {
      if (
        !this.state.routeEstimate &&
        !this.state.routeEstimateLoading &&
        this.state.routeEstimateError
      ) {
        void this.requestRouteEstimate(
          this.state.selectedAddress,
          this.state.selectedAddressRequiresVerification
        );
      }
      return;
    }
    if (
      this.state.addressSuggestions.length === 0 &&
      this.state.customerDeliveryAddress.trim().length >= 3
    ) {
      this.scheduleAddressSearch(this.state.customerDeliveryAddress);
    }
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
    const customerDeliveryAddress = this.state.customerDeliveryAddress.trim();
    const note = this.state.note.trim();

    if (
      !customerName ||
      !customerEmail ||
      !customerPhone ||
      !customerDeliveryAddress
    ) {
      this.setState({
        error:
          'Please fill in name, delivery address and phone before placing an order.',
        sent: false,
      });
      return;
    }

    if (
      !this.state.selectedAddress?.isExactHouse ||
      !this.state.routeEstimate
    ) {
      this.setState({
        error:
          'Choose a delivery address with a house number from the suggestions.',
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
        customerDeliveryAddress,
        deliveryLat: this.state.selectedAddress.lat,
        deliveryLon: this.state.selectedAddress.lon,
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
            {this.props.user && (
              <PushNotificationControl
                isSubscribed={Boolean(this.props.user.pushSubscription)}
                onSubscribe={this.props.onPushSubscribe}
              />
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
              type="text"
              value={this.state.customerDeliveryAddress}
              onChange={(event) =>
                this.scheduleAddressSearch(event.target.value)
              }
              onFocus={this.handleAddressFocus}
              placeholder="Delivery address"
              autoComplete="street-address"
              required
            />
            {this.state.addressSearchLoading && (
              <small aria-live="polite">Searching addresses...</small>
            )}
            {this.state.savedAddressLoading && (
              <small aria-live="polite">
                Loading saved delivery address...
              </small>
            )}
            {this.state.addressSearchError && (
              <p className="modal-error" role="alert">
                {this.state.addressSearchError}
              </p>
            )}
            {this.state.addressSuggestions.length > 0 && (
              <div className="address-suggestions-panel">
                <p className="address-suggestions-heading">
                  Select an address to calculate delivery
                </p>
                <ul className="address-suggestions" role="listbox">
                  {this.state.addressSuggestions.map((address) => (
                    <li key={`${address.formatted}:${address.lat}:${address.lon}`}>
                      <button
                        type="button"
                        role="option"
                        aria-selected="false"
                        disabled={!address.isExactHouse}
                        onClick={() => void this.selectAddress(address)}
                      >
                        {address.formatted}
                        {!address.isExactHouse && ' — add a house number'}
                      </button>
                    </li>
                  ))}
                </ul>
              </div>
            )}
            {this.state.routeEstimateLoading && (
              <small aria-live="polite">Calculating delivery route...</small>
            )}
            {this.state.routeEstimateError && (
              <p className="modal-error" role="alert">
                {this.state.routeEstimateError}
              </p>
            )}
            {this.state.routeEstimate && (
              <>
                <p className="address-selected-note" role="status">
                  Address selected and verified
                </p>
                <div className="delivery-estimate" aria-live="polite">
                  <span>
                    Distance:{' '}
                    {this.toFixed(
                      this.state.routeEstimate.distanceMeters / 1000
                    )}{' '}
                    km
                  </span>
                  <span>
                    Delivery:{' '}
                    {this.state.routeEstimate.deliveryCost === null
                      ? 'tariff not configured'
                      : `${this.toFixed(this.state.routeEstimate.deliveryCost)} ${this.state.routeEstimate.currencySymbol}`}
                  </span>
                </div>
              </>
            )}
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
