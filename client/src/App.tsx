import Navbar from './components/Navbar';
import AuthModal from './components/AuthModal';
import BasketDrawer, { type OrderPayload } from './components/BasketDrawer';
import Home from './components/sections/Home';
import Products, {
  BasketItem,
  PublicProductData,
} from './components/sections/Products';
import Delivery from './components/sections/Delivery';
import Contacts from './components/sections/Contacts';
import Tool from './components/sections/Tool.tsx';
//import About from './components/sections/About';
import { I18nContext, type I18nContextValue } from './i18n/I18nContext';
import './App.css';
import Proto from './proto';
import Instructions from './components/sections/instructions.tsx';

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
    }
  }
`;

const SEND_ORDER_BY_EMAIL_MUTATION = `
  mutation SendOrderByEmail($input: SendOrderInput!) {
    sendOrderByEmail(input: $input)
  }
`;

export interface User {
  id: string;
  name: string;
  fullName: string;
  entityType: 'INDIVIDUAL' | 'LEGAL_ENTITY';
  email: string;
  phone?: string | null;
  pib?: string | null;
  mbr?: string | null;
  account?: string | null;
  bank?: string | null;
}

export interface DiscountTier {
  threshold: number;
  discount: number;
}

export interface ProductPriceVariation {
  label: string;
  price: number;
  legalEntityPrice?: number;
  unit?: string;
  weight?: number;
  weightUnit?: string;
}

interface AppState {
  user: User | null;
  currentPage: 'home' | 'tool';
  activeToolChapter: string;
  basket: BasketItem[];
  isLoadingBasket: boolean;
  basketOpen: boolean;
  authOpen: boolean;
  authInitialTab: 'login' | 'signup';
  authInitialSignupEntityType: 'INDIVIDUAL' | 'LEGAL_ENTITY';
  authEditingUser: User | null;
  pendingProduct: PublicProductData | null;
  editedMovementId: string | null; // <-- Храним ID брони здесь
}

interface SessionUserQueryData {
  sessionUser: User | null;
}
export interface BasketMovementGroupResult {
  id: string;
  label: string | null;
  basket: { productId: string; quantity: number }[];
  createdAt: Date;
}

class App extends Proto<Record<string, never>, AppState> {
  static contextType = I18nContext;
  declare context: I18nContextValue | null;
  private sessionSyncTimeoutId: ReturnType<typeof setTimeout> | null = null;

  state: AppState = {
    user: null,
    currentPage:
      typeof window !== 'undefined' && window.location.pathname === '/tool'
        ? 'tool'
        : 'home',
    activeToolChapter: 'Cleaning',
    basket: [],
    isLoadingBasket: false,
    basketOpen: false,
    authOpen: false,
    authInitialTab: 'login',
    authInitialSignupEntityType: 'INDIVIDUAL',
    authEditingUser: null,
    pendingProduct: null,
    editedMovementId: null,
  };

  componentDidMount() {
    void this.restoreSessionFromServer();
    this.scheduleSessionSync();
    window.addEventListener('popstate', this.syncPageFromLocation);
  }

  componentWillUnmount() {
    this.clearSessionSync();
    window.removeEventListener('popstate', this.syncPageFromLocation);
  }

  private isToolPath = (pathname: string) =>
    pathname === '/tool' || pathname === '/tool/';

  private syncPageFromLocation = () => {
    const currentPage = this.isToolPath(window.location.pathname)
      ? 'tool'
      : 'home';

    if (currentPage !== this.state.currentPage) {
      this.setState({ currentPage });
    }
  };

  private navigateTo = (path: '/tool' | '/') => {
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
      if (data?.sessionUser) {
        this.setState({ user: data.sessionUser }, () => {
          this.getReserves();
        });
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
        reserves {
          id
          label
          createdAt
          basket {
            productId
            quantity
          }
        }
        products {
          id
          name {
            default
            ts
          }
          priceOptions
        }
      }
      `;
    const data = await this.gql(GET_RESERVES_BY_USER);
    console.log(data);
    const reserves: BasketMovementGroupResult = (data as any).reserves;
    const products: PublicProductData[] = (data as any).products;
    if (!reserves) return;
    this.setState(
      (prevState) => {
        return {
          ...prevState,
          editedMovementId: reserves.id,
          isLoadingBasket: true,
          basket: reserves.basket.map((el) => {
            return {
              id: el.productId,
              quantity: el.quantity,
              product: products.find((p) => p.id === el.productId)!,
              price: products.find((p) => p.id === el.productId)?.priceOptions
                .individualPrice!,
              amount:
                products.find((p) => p.id === el.productId)?.priceOptions
                  .individualPrice! * el.quantity,
            };
          }),
        };
      },
      () => {
        this.setState({ ...this.state, isLoadingBasket: false });
      }
    );
  }

  private async reserveBasket(basket: BasketItem[]) {
    const RESERVE_MUTATION = `
      mutation Reserve($input: UpdateReserveInput!) {
        reserve(input: $input) {
          id
          label
          createdAt
          basket {
            productId
            quantity
          }
        }
      }
    `;

    // Если корзина пустая, возможно, нужно очистить бронь на сервере или просто выйти
    if (basket.length === 0) return null;
    // Если запрос уже выполняется, выходим, чтобы не плодить фантомы
    if (this.state.isLoadingBasket) return null;

    // Включаем блокировку
    //this.setState({ isLoadingBasket: true });

    try {
      const data = await this.gql(RESERVE_MUTATION, {
        input: {
          // Передаем существующий ID, чтобы сервер обновил старую бронь, а не создавал новую
          editedMovementId: this.state.editedMovementId,

          reserves: basket.map((el) => ({
            productId: el.product.id,
            quantity: el.quantity,
          })),
        },
      });

      const reserves: BasketMovementGroupResult = (data as any).reserves;
      const products: PublicProductData[] = (data as any).products;
      if (!reserves) return;
      this.setState(
        (prevState) => {
          return {
            ...prevState,
            editedMovementId: reserves.id,
            isLoadingBasket: true,
            basket: reserves.basket.map((el) => {
              return {
                id: el.productId,
                quantity: el.quantity,
                product: products.find((p) => p.id === el.productId)!,
                price: products.find((p) => p.id === el.productId)?.priceOptions
                  .individualPrice!,
                amount:
                  products.find((p) => p.id === el.productId)?.priceOptions
                    .individualPrice! * el.quantity,
              };
            }),
          };
        },
        () => {
          this.setState({ ...this.state, isLoadingBasket: false });
        }
      );
    } catch (error) {
      console.error('Ошибка при резервировании корзины:', error);
      return null;
    }
  }

  componentDidUpdate(_: Readonly<{}>, prevState: Readonly<AppState>) {
    // Сравниваем только basket. Если изменился editedMovementId, запрос повторно не пойдет
    if (prevState.basket !== this.state.basket) {
      this.reserveBasket(this.state.basket);
    }
  }

  // Метод добавления стал чистым и лаконичным
  addToBasket = (product: PublicProductData) => {
    this.setState((prevState) => {
      const isExisting = prevState.basket.some(
        (i) => i.product.id === product.id
      );
      let updatedBasket: BasketItem[];

      if (isExisting) {
        updatedBasket = prevState.basket.map((item) => {
          if (item.product.id === product.id) {
            const nextQuantity = item.quantity + 1;
            return {
              ...item,
              quantity: nextQuantity,
              amount: nextQuantity * item.price,
            };
          }
          return item;
        });
      } else {
        const price = product.priceOptions.individualPrice!;
        updatedBasket = [
          ...prevState.basket,
          { product, quantity: 1, price, amount: price },
        ];
      }

      return { basket: updatedBasket };
    }); // Второй аргумент (колбэк) больше НЕ нужен!
  };

  handleAddToBasket = (product: PublicProductData) => {
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
        if (this.state.pendingProduct) {
          const product = this.state.pendingProduct;
          this.addToBasket(product);
          this.getReserves();

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
    this.setState({ activeToolChapter: chapter });
  };

  handleOpenLogin = () => {
    this.setState({
      authOpen: true,
      authInitialTab: 'login',
      authInitialSignupEntityType: 'INDIVIDUAL',
      authEditingUser: null,
    });
  };

  handleIncreaseBasketItemQty = (index: number) => {
    this.setState((prevState) => ({
      basket: prevState.basket.map((item, itemIndex) =>
        itemIndex === index ? { ...item, quantity: item.quantity + 1 } : item
      ),
    }));
  };

  handleDecreaseBasketItemQty = (index: number) => {
    this.setState((prevState) => {
      const targetItem = prevState.basket[index];
      if (!targetItem) {
        return null;
      }

      if (targetItem.quantity <= 1) {
        return {
          basket: prevState.basket.filter(
            (_, itemIndex) => itemIndex !== index
          ),
        };
      }

      return {
        basket: prevState.basket.map((item, itemIndex) =>
          itemIndex === index ? { ...item, quantity: item.quantity - 1 } : item
        ),
      };
    });
  };

  handleRemoveBasketItem = (index: number) => {
    this.setState((prevState) => ({
      basket: prevState.basket.filter((_, itemIndex) => itemIndex !== index),
    }));
  };

  handleSubmitOrder = async (payload: OrderPayload) => {
    const response = await fetch(API_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify({
        query: SEND_ORDER_BY_EMAIL_MUTATION,
        variables: {
          input: payload,
        },
      }),
    });

    const json = await response.json();
    if (json.errors?.length) {
      throw new Error(json.errors[0].message);
    }

    this.setState({ basket: [] });
  };

  render() {
    const i18n = this.context;
    if (!i18n) {
      throw new Error('App must be used within I18nProvider');
    }

    const {
      user,
      currentPage,
      activeToolChapter,
      basket,
      basketOpen,
      authOpen,
      authInitialTab,
      authInitialSignupEntityType,
      authEditingUser,
      pendingProduct,
    } = this.state;
    const basketCount = basket.reduce((sum, i) => sum + i.quantity, 0);
    const isStaffUser = this.isStaffUser(user);
    const isToolPage = currentPage === 'tool';
    const canAccessTool = isToolPage && isStaffUser;

    return (
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
              <Tool activeChapter={activeToolChapter} user={user} />
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
              />
              <Products
                onAddToBasket={this.handleAddToBasket}
                onLegalEntityCtaClick={this.handleLegalEntityCtaClick}
                userEntityType={user?.entityType ?? null}
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
          isOpen={basketOpen}
          user={user}
          items={basket}
          onClose={this.handleCloseBasket}
          onIncreaseQty={this.handleIncreaseBasketItemQty}
          onDecreaseQty={this.handleDecreaseBasketItemQty}
          onRemoveItem={this.handleRemoveBasketItem}
          onSubmitOrder={this.handleSubmitOrder}
        />
      </div>
    );
  }
}

export default App;
