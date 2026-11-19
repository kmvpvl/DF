import Navbar from './components/Navbar';
import AuthModal from './components/AuthModal';
import BasketDrawer, { type OrderPayload } from './components/BasketDrawer';
import Home from './components/sections/Home';
import Products, {
  PUBLIC_PRODUCT_FIELDS,
  SLIM_PRODUCT_FIELDS,
} from './components/sections/Products';
import Delivery from './components/sections/Delivery';
import Contacts from './components/sections/Contacts';
import Tool from './components/sections/Tool.tsx';
//import About from './components/sections/About';
import { I18nContext, type I18nContextValue } from './i18n/I18nContext';
import './App.css';
import Proto, { IProtoProps, IProtoState, User } from './proto';
import Instructions from './components/sections/instructions.tsx';
import {
  IOrder,
  IOrderProduct,
  OrderStatus,
} from './components/sections/Orders.tsx';
import { ICompany } from '@betypes/company.ts';
import { PublicProductData } from '@betypes/product.ts';
import Customer from './components/sections/customer/customer.tsx';

const API_URL = `${import.meta.env.VITE_API_BASE_URL}/graphql`;
//console.log('Using API URL:', API_URL);
const STAFF_EMAILS_RAW =
  import.meta.env.VITE_STAFF_EMAILS ??
  (import.meta as { env?: Record<string, string | undefined> }).env
    ?.STAFF_EMAILS ??
  '';
//console.log('Loaded staff emails:', STAFF_EMAILS_RAW);
const STAFF_EMAILS = new Set(
  STAFF_EMAILS_RAW.split(',')
    .map((email) => email.trim().toLowerCase())
    .filter(Boolean)
);
//console.log('Parsed staff emails:', Array.from(STAFF_EMAILS));
const SESSION_DURATION_MINUTES = Number.parseInt(
  import.meta.env.VITE_SESSION_DURATION_MINUTES ?? '15',
  10
);
const SESSION_SYNC_INTERVAL_MS =
  (Number.isFinite(SESSION_DURATION_MINUTES) && SESSION_DURATION_MINUTES > 0
    ? SESSION_DURATION_MINUTES
    : 15) *
  60 *
  1000;
const SESSION_USER_QUERY = `
  query SessionUser {
    sessionUser {
      id
      name
      fullName
      entityType
      email
      phone
      pib
      mbr
      account
      bank
      deliveryAddress
      pushSubscription
    }
    companyInfo {
        id
        name
        locations {
          id
          name
          timezone
          currencyCode
          currencySymbol
          createdAt
          updatedAt
        }
        createdAt
        updatedAt
      }
    }
`;

const SEND_ORDER_BY_EMAIL_MUTATION = `
  mutation SendOrderByEmail($input: SendOrderInput!) {
    sendOrderByEmail(input: $input)
  }
`;

const QUERY_PUBLIC_STOCKS = `
query {
  getPublicProductsWithStock {
    ${PUBLIC_PRODUCT_FIELDS}
    stockBalances {
      productId
      variantLabel
      locationId
      physical_balance
      reserved_balance
    }
  }
}`;

//interface AppProps extends Record<string, never>;
interface AppProps extends IProtoProps {}

interface AppState extends IProtoState {
  currentPage: string;
  activeChapter: string;
  basket?: IOrder;
  isLoadingBasket: boolean;
  basketOpen: boolean;
  authOpen: boolean;
  authInitialTab: 'login' | 'signup';
  authInitialSignupEntityType: 'INDIVIDUAL' | 'LEGAL_ENTITY';
  authEditingUser: User | null;
  pendingProduct: IOrderProduct | null;
  products: PublicProductData[];
  objectId?: string;
}

interface SessionUserQueryData {
  sessionUser: User | null;
  companyInfo: ICompany | null;
}

class App extends Proto<AppProps, AppState> {
  static contextType = I18nContext;
  declare context: I18nContextValue | null;
  private sessionSyncTimeoutId: ReturnType<typeof setTimeout> | null = null;

  state: AppState = {
    user: null,
    companyInfo: null,
    currentLocation: null,
    currentPage:
      typeof window !== 'undefined' && window.location.pathname.split("/")[1]
        ? window.location.pathname.split("/")[1]
        : 'home',
    activeChapter: 
      typeof window !== 'undefined' && window.location.pathname.split("/")[2]
        ? window.location.pathname.split("/")[2]
        : 'Orders',
    objectId:
      typeof window !== 'undefined' && window.location.pathname.split("/")[3]
        ? window.location.pathname.split("/")[3]
        : undefined,
    isLoadingBasket: false,
    basketOpen: false,
    authOpen: false,
    authInitialTab: 'login',
    authInitialSignupEntityType: 'INDIVIDUAL',
    authEditingUser: null,
    pendingProduct: null,
    products: [],
  };

  async fetchProducts() {
    try {
      const data = await this.gql<{ getPublicProductsWithStock: PublicProductData[] }>(QUERY_PUBLIC_STOCKS);
      const products = data.getPublicProductsWithStock;
      this.setState(
        {
          ...this.state,
          products,
        },
        () => {}
      );
    } catch (error) {}
  }

  componentDidMount() {
    void this.restoreSessionFromServer();
    this.scheduleSessionSync();
    this.fetchProducts();
    window.addEventListener('popstate', this.syncPageFromLocation);
  }

  componentWillUnmount() {
    this.clearSessionSync();
    window.removeEventListener('popstate', this.syncPageFromLocation);
  }

  private syncPageFromLocation = () => {
      this.setState({ 
    currentPage:
      typeof window !== 'undefined' && window.location.pathname.split("/")[1]
        ? window.location.pathname.split("/")[1]
        : 'home',
    activeChapter: 
      typeof window !== 'undefined' && window.location.pathname.split("/")[2]
        ? window.location.pathname.split("/")[2]
        : 'Orders',
    objectId:
      typeof window !== 'undefined' && window.location.pathname.split("/")[3]
        ? window.location.pathname.split("/")[3]
        : undefined,
       });
  };

  private navigateTo = (path: '/tool' | '/' | '/customer') => {
    if (window.location.pathname !== path) {
      window.history.pushState({}, '', path);
    }
    this.syncPageFromLocation();
  };

  private isStaffUser = (user: User | null): boolean => {
    if (!user?.email) {
      return false;
    }

    return STAFF_EMAILS.has(user.email.trim().toLowerCase());
  };

  private clearSessionSync = () => {
    if (this.sessionSyncTimeoutId) {
      clearTimeout(this.sessionSyncTimeoutId);
      this.sessionSyncTimeoutId = null;
    }
  };

  private scheduleSessionSync = () => {
    this.clearSessionSync();
    this.sessionSyncTimeoutId = setTimeout(() => {
      void this.restoreSessionFromServer();
      this.scheduleSessionSync();
    }, SESSION_SYNC_INTERVAL_MS);
  };

  private restoreSessionFromServer = async () => {
    try {
      const response = await fetch(API_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ query: SESSION_USER_QUERY, variables: {} }),
      });

      const json = await response.json();
      if (json.errors?.length) {
        return;
      }

      const data = json.data as SessionUserQueryData | undefined;
      if (data) {
        this.setState(
          {
            user: data.sessionUser,
            companyInfo: data.companyInfo,
            currentLocation: data.companyInfo?.locations[0].id,
          },
          () => {
            this.getReserves();
          }
        );
      } else {
        this.setState({ user: null });
      }
    } catch {
      // Keep anonymous state when session restoration fails.
    }
  };

  private async getReserves() {
    const GET_RESERVES_BY_USER = `
    query Reserves {
      getDraft { 
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
    }`;
    const data = await this.gql(GET_RESERVES_BY_USER, { state: 'DRAFT' });
    const order: IOrder = (data as any).getDraft;
    if (!order) return;
    this.setState(
      (prevState) => ({
        ...prevState,
        isLoadingBasket: true,
        basket: order,
      }),
      () => {
        this.setState({ ...this.state, isLoadingBasket: false });
      }
    );
  }

  private async reserveBasket(basket: IOrder) {
    const RESERVE_MUTATION = `
      mutation Reserve($input: CreateOrderInput!) {
        draft(input: $input) {
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

    // Если корзина пустая, возможно, нужно очистить бронь на сервере или просто выйти
    //if (basket.products.length === 0) return null;
    // Если запрос уже выполняется, выходим, чтобы не плодить фантомы
    if (this.state.isLoadingBasket) return null;

    // Включаем блокировку
    //this.setState({ isLoadingBasket: true });
    try {
      const dataPromise = this.gql(RESERVE_MUTATION, {
        input: {
          ...basket,
          customerName: this.state.user?.fullName,
          products: basket.products.map((p) => ({
            productId: p.productId,
            quantity: p.quantity,
            sortOrder: p.sortOrder,
            variantLabel: p.variantLabel,
          })),
        },
      });
      this.setState({
        ...this.state,
        isLoadingBasket: true,
      });
      dataPromise
        .finally(() => {
          //this.setState({ ...this.state, isLoadingBasket: false });
          this.fetchProducts();
        })
        .then((data) => {
          const order: IOrder = (data as any).draft;
          this.setState(
            (prevState) => ({
              ...prevState,
              basket: order,
            }),
            () => {
              this.setState({
                ...this.state,
                isLoadingBasket: false,
              });
            }
          );
        })
        .catch((error) => {
          console.error('Ошибка при резервировании корзины:', error);
          return null;
        });
    } catch (error) {
      console.error('Ошибка при резервировании корзины:', error);
      debugger;
      this.setState({ ...this.state, isLoadingBasket: false });
    }
  }

  componentDidUpdate(_: Readonly<{}>, prevState: Readonly<AppState>) {
    if (prevState.basket !== this.state.basket) {
      if (this.state.basket && !this.state.isLoadingBasket)
        this.reserveBasket(this.state.basket);
    }
  }

  addToBasket = (product: IOrderProduct) => {
    let updatedBasket: IOrder;
    if (this.state.basket) {
      updatedBasket = { ...this.state.basket };
    } else {
      updatedBasket = {
        status: OrderStatus.DRAFT,
        orderDate: new Date(),
        products: [],
      };
    }
    if (
      !updatedBasket.products.some((el) => {
        if (
          el.productId === product.productId &&
          el.variantLabel === product.variantLabel
        ) {
          el.quantity += 1;
          return true;
        } else return false;
      })
    ) {
      updatedBasket.products.push({
        productId: product.productId!,
        quantity: 1,
        sortOrder: updatedBasket.products.length,
        variantLabel: product.variantLabel,
      });
    }

    this.setState({
      ...this.state,
      basket: updatedBasket,
    });
  };

  handleAddToBasket = (product: IOrderProduct) => {
    if (!this.state.user) {
      this.setState({
        pendingProduct: product,
        authOpen: true,
        authInitialTab: 'login',
        authInitialSignupEntityType: 'INDIVIDUAL',
        authEditingUser: null,
      });
      return;
    }

    this.addToBasket(product);
  };

  handleLegalEntityCtaClick = () => {
    this.setState(
      {
        authOpen: true,
        basketOpen: false,
        pendingProduct: null,
        authInitialTab: 'signup',
        authInitialSignupEntityType: 'LEGAL_ENTITY',
        authEditingUser: null,
      },
      () => {
        this.getReserves();
      }
    );
  };

  handleUserEditClick = () => {
    if (!this.state.user) {
      return;
    }

    this.setState({
      authOpen: true,
      basketOpen: false,
      pendingProduct: null,
      authInitialTab: 'signup',
      authInitialSignupEntityType: this.state.user.entityType,
      authEditingUser: this.state.user,
    });
  };

  handleAuthSuccess = (loggedInUser: User) => {
    this.setState(
      () => ({
        user: loggedInUser,
        authOpen: false,
        authInitialTab: 'login',
        authInitialSignupEntityType: 'INDIVIDUAL',
        authEditingUser: null,
      }),
      () => {
        this.getReserves();
        if (this.state.pendingProduct) {
          const product = this.state.pendingProduct;
          this.addToBasket({
            productId: product.productId,
            quantity: 1,
            variantLabel: product.variantLabel,
          });

          this.setState({ pendingProduct: null });
        }
      }
    );
  };

  handleCloseAuth = () => {
    this.setState({
      authOpen: false,
      pendingProduct: null,
      authInitialTab: 'login',
      authInitialSignupEntityType: 'INDIVIDUAL',
      authEditingUser: null,
    });
  };

  handleOpenBasket = () => {
    this.setState({ basketOpen: true });
  };

  handleCloseBasket = () => {
    this.setState({ basketOpen: false });
  };

  handleOpenToolPage = () => {
    this.navigateTo('/tool');
  };

  handleOpenHomePage = () => {
    this.navigateTo('/');
  };

  handleToolChapterChange = (chapter: string) => {
    this.setState({ activeChapter: chapter });
  };

  handleOpenLogin = () => {
    this.setState({
      authOpen: true,
      authInitialTab: 'login',
      authInitialSignupEntityType: 'INDIVIDUAL',
      authEditingUser: null,
    });
  };

  handleIncreaseBasketItemQty = (id: string, variantLabel?: string) => {
    this.setState((prevState) => {
      return {
        ...prevState,
        basket: {
          ...prevState.basket,
          status: prevState.basket!.status!,
          products: prevState.basket?.products.map((el) => ({
            ...el,
            quantity:
              el.productId === id && el.variantLabel === variantLabel
                ? el.quantity + 1
                : el.quantity,
          }))!,
        },
      };
    });
  };

  handleDecreaseBasketItemQty = (id: string, variantLabel?: string) => {
    this.setState((prevState) => {
      return {
        ...prevState,
        basket: {
          ...prevState.basket,
          status: prevState.basket!.status!,
          products: prevState
            .basket!.products.map((el) => ({
              ...el,
              quantity:
                el.productId === id && el.variantLabel === variantLabel
                  ? el.quantity - 1
                  : el.quantity,
            }))
            .filter((el) => el.quantity > 0)!,
        },
      };
    });
  };

  handleRemoveBasketItem = (id: string, variantlabel?: string) => {
    this.setState((prevState) => {
      return {
        ...prevState,

        basket: {
          ...prevState.basket,
          status: prevState.basket!.status!,
          products: prevState.basket?.products
            .map((el) => ({
              ...el,
              quantity:
                el.productId === id && el.variantLabel === variantlabel
                  ? 0
                  : el.quantity,
            }))
            .filter((el) => el.quantity > 0)!,
        },
      };
    });
  };

  handleSubmitOrder = async (payload: OrderPayload) => {
    const data = await this.gql<{ sendOrderByEmail: boolean }>(SEND_ORDER_BY_EMAIL_MUTATION, {
      input: payload,
    });
    if (data.sendOrderByEmail !== true) {
      throw new Error(this.ML('Failed to place order.'));
    }

    this.setState((prevState) => ({
      basket: undefined,
      user: prevState.user
        ? { ...prevState.user, phone: payload.customerPhone }
        : prevState.user,
    }));
  };

  async subscribeUserToPush() {
    function urlBase64ToUint8Array(base64String: string): ArrayBuffer {
      const padding = '='.repeat((4 - (base64String.length % 4)) % 4);
      const base64 = (base64String + padding)
        .replace(/-/g, '+')
        .replace(/_/g, '/');
      const rawData = window.atob(base64);
      const outputArray = new Uint8Array(rawData.length);
      for (let i = 0; i < rawData.length; ++i) {
        outputArray[i] = rawData.charCodeAt(i);
      }
      // Возвращаем чистый ArrayBuffer
      return outputArray.buffer as ArrayBuffer;
    }

    // Проверяем, запущено ли как PWA (standalone)
    const isStandalone =
      window.matchMedia('(display-mode: standalone)').matches ||
      (window.navigator as any).standalone;

    if (!isStandalone) {
      alert(
        "Для включения уведомлений на iOS сначала добавьте приложение на экран 'Домой' через меню 'Поделиться'!"
      );
      return;
    }

    if ('serviceWorker' in navigator && 'PushManager' in window) {
      try {
        // 1. Регистрируем SW
        const registration = await navigator.serviceWorker.register('/sw.js');

        // 2. Запрашиваем права (строго по клику!)
        const permission = await Notification.requestPermission();
        if (permission !== 'granted') {
          console.error('Права на уведомления не получены');
          return;
        }

        // 3. Получаем публичный VAPID-ключ от вашего Node.js бэкенда
        const VAPID_PUBLIC_KEY = import.meta.env.VITE_PUBLIC_VAPID_KEY;

        // 4. Подписываемся в Apple Push Service (APNs) через браузерный API
        const subscription = await registration.pushManager.subscribe({
          userVisibleOnly: true,
          applicationServerKey: urlBase64ToUint8Array(VAPID_PUBLIC_KEY),
        });
        console.log(subscription);

        const MUTATION_ADD_PUSH_SUBSCRIPTION = `
          mutation UpdateSessionUser($input: UpdateSessionUserInput!) {
            updateSessionUser(input: $input) {
              id
              name
              fullName
              entityType
              phone
              email
              bio
              tgId
              pib
              mbr
              account
              bank
              passwordHash
              pushSubscription
              deliveryAddress
              createdAt
              updatedAt
            }
          }
        `;
        const newData = await this.gql<{ updateSessionUser: User }>(MUTATION_ADD_PUSH_SUBSCRIPTION, {
          input: {
            name: this.state.user?.name,
            fullName: this.state.user?.fullName,
            entityType: this.state.user?.entityType,
            email: this.state.user?.email,
            phone: this.state.user?.phone || undefined,
            pib:
              this.state.user?.entityType === 'LEGAL_ENTITY'
                ? this.state.user?.pib
                : null,
            mbr:
              this.state.user?.entityType === 'LEGAL_ENTITY'
                ? this.state.user?.mbr
                : null,
            account:
              this.state.user?.entityType === 'LEGAL_ENTITY'
                ? this.state.user?.account
                : null,
            bank:
              this.state.user?.entityType === 'LEGAL_ENTITY'
                ? this.state.user?.bank
                : null,
            pushSubscription: subscription,
            deliveryAddress: this.state.user?.deliveryAddress,
          },
        });

        this.setState({
          ...this.state,
          user: newData.updateSessionUser as any,
        });
      } catch (error) {
        console.error('Ошибка подписки:', error);
      }
    }
  }

  render() {
    const i18n = this.context;
    if (!i18n) {
      throw new Error('App must be used within I18nProvider');
    }

    const {
      user,
      currentPage,
      activeChapter: activeToolChapter,
      basket,
      basketOpen,
      authOpen,
      authInitialTab,
      authInitialSignupEntityType,
      authEditingUser,
      companyInfo,
    } = this.state;
    const basketCount =
      basket?.products?.reduce((sum, i) => sum + i.quantity, 0) ?? 0;
    const isStaffUser = user ? this.isStaffUser(user) : false;
    const isToolPage = currentPage === 'tool';
    const canAccessTool = isToolPage && isStaffUser;

    return (
      this.state.currentPage === "customer" 
      ? <><Customer
        user={this.state.user}
        companyInfo={this.state.companyInfo}
        currentLocation={this.state.currentLocation}
        chapter={this.state.activeChapter}
        objectId={this.state.objectId}
        onLoginRequired={this.handleOpenLogin}
        onCloseAuth={this.handleCloseAuth}
        /> 
        {authOpen && (
          <AuthModal
            onSuccess={this.handleAuthSuccess}
            onClose={this.handleCloseAuth}
            pendingProductName={null}
            initialTab={authInitialTab}
            initialSignupEntityType={authInitialSignupEntityType}
            editingUser={authEditingUser}
          />
        )}
      </>
      :
      <div className="app">
        <Navbar
          user={user}
          isToolPage={isToolPage}
          isStaffUser={isStaffUser}
          basketCount={basketCount}
          onUserClick={this.handleUserEditClick}
          onBasketClick={this.handleOpenBasket}
          onToolClick={this.handleOpenToolPage}
          onHomeClick={this.handleOpenHomePage}
          activeToolChapter={activeToolChapter}
          onToolChapterChange={this.handleToolChapterChange}
        />
        <main>
          {isToolPage ? (
            canAccessTool ? (
              <Tool
                activeChapter={activeToolChapter}
                objectId={this.state.objectId}
                user={user}
                companyInfo={companyInfo}
                currentLocation={this.state.currentLocation}
              />
            ) : (
              <section className="tool-access-denied" aria-live="polite">
                <div className="tool-access-denied-inner">
                  <p className="section-label">Restricted</p>
                  <h1 className="section-title">
                    {this.ML('Tool').toString()} {this.ML('page').toString()}
                  </h1>
                  <p className="section-desc">
                    This page is available only for staff users listed in
                    STAFF_EMAILS.
                  </p>
                  <div className="tool-access-actions">
                    {!user ? (
                      <button
                        className="btn-primary"
                        onClick={this.handleOpenLogin}
                      >
                        {this.ML('Login').toString()}
                      </button>
                    ) : null}
                    <button
                      className="btn-primary"
                      onClick={this.handleOpenHomePage}
                    >
                      {this.ML('Home').toString()}
                    </button>
                  </div>
                </div>
              </section>
            )
          ) : (
            <>
              <Home
                onLegalEntityCtaClick={this.handleLegalEntityCtaClick}
                userEntityType={user?.entityType ?? null}
                isLoggedIn={Boolean(user)}
                isPushSubscribed={Boolean(user?.pushSubscription)}
                onPushSubscribe={this.subscribeUserToPush.bind(this)}
              />
              <Products
                user={this.state.user}
                currentLocation={this.state.currentLocation}
                companyInfo={this.state.companyInfo}
                onAddToBasket={this.handleAddToBasket}
                onLegalEntityCtaClick={this.handleLegalEntityCtaClick}
                products={this.state.products}
              />
              <Delivery />
              <Contacts />
              <Instructions />
            </>
          )}
        </main>
        <footer className="footer">
          <strong>DolceForte</strong> &copy; {new Date().getFullYear()} -{' '}
          {this.ML(
            'Production of Italian and Russian desserts, cheese and cottage cheese'
          ).toString()}
        </footer>
        {authOpen && (
          <AuthModal
            onSuccess={this.handleAuthSuccess}
            onClose={this.handleCloseAuth}
            pendingProductName={null}
            initialTab={authInitialTab}
            initialSignupEntityType={authInitialSignupEntityType}
            editingUser={authEditingUser}
          />
        )}
        <BasketDrawer
          companyInfo={this.state.companyInfo}
          currentLocation={this.state.currentLocation}
          isOpen={basketOpen}
          user={user}
          order={basket}
          onClose={this.handleCloseBasket}
          onIncreaseQty={this.handleIncreaseBasketItemQty}
          onDecreaseQty={this.handleDecreaseBasketItemQty}
          onRemoveItem={this.handleRemoveBasketItem}
          onSubmitOrder={this.handleSubmitOrder}
          onPushSubscribe={this.subscribeUserToPush.bind(this)}
          disableConrols={this.state.isLoadingBasket}
        />
      </div>
    );
  }
}

export default App;
