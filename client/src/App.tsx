import Navbar from './components/Navbar';
import AuthModal from './components/AuthModal';
import Home from './components/sections/Home';
import Products from './components/sections/Products';
import Delivery from './components/sections/Delivery';
import Contacts from './components/sections/Contacts';
//import About from './components/sections/About';
import { I18nContext, type I18nContextValue } from './i18n/I18nContext';
import './App.css';
import Proto from './proto';

const API_URL = `${import.meta.env.VITE_API_BASE_URL}/graphql`;
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

export interface Product {
  id: number;
  name: string;
  description: string;
  price: number;
  legalEntityPrice?: number;
  priceUnit?: string;
  selectedVariationLabel?: string;
  selectedWeightGrams?: number;
  emoji: string;
  chapter: string;
  photos?: string[];
  discounts?: DiscountTier[];
  priceVariations?: ProductPriceVariation[];
}

export interface BasketItem {
  product: Product;
  qty: number;
}

interface AppState {
  user: User | null;
  basket: BasketItem[];
  authOpen: boolean;
  authInitialTab: 'login' | 'signup';
  authInitialSignupEntityType: 'INDIVIDUAL' | 'LEGAL_ENTITY';
  authEditingUser: User | null;
  pendingProduct: Product | null;
}

interface SessionUserQueryData {
  sessionUser: User | null;
}

class App extends Proto<Record<string, never>, AppState> {
  static contextType = I18nContext;
  declare context: I18nContextValue | null;
  private sessionSyncTimeoutId: ReturnType<typeof setTimeout> | null = null;

  state: AppState = {
    user: null,
    basket: [],
    authOpen: false,
    authInitialTab: 'login',
    authInitialSignupEntityType: 'INDIVIDUAL',
    authEditingUser: null,
    pendingProduct: null,
  };

  componentDidMount() {
    void this.restoreSessionFromServer();
    this.scheduleSessionSync();
  }

  componentWillUnmount() {
    this.clearSessionSync();
  }

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
        this.setState({ user: data.sessionUser });
      } else {
        this.setState({ user: null });
      }
    } catch {
      // Keep anonymous state when session restoration fails.
    }
  };

  addToBasket = (product: Product) => {
    this.setState((prevState) => {
      const existing = prevState.basket.find(
        (i) =>
          i.product.id === product.id &&
          i.product.selectedVariationLabel === product.selectedVariationLabel &&
          i.product.selectedWeightGrams === product.selectedWeightGrams
      );
      if (existing) {
        return {
          basket: prevState.basket.map((i) =>
            i.product.id === product.id &&
            i.product.selectedVariationLabel ===
              product.selectedVariationLabel &&
            i.product.selectedWeightGrams === product.selectedWeightGrams
              ? { ...i, qty: i.qty + 1 }
              : i
          ),
        };
      }

      return {
        basket: [...prevState.basket, { product, qty: 1 }],
      };
    });
  };

  handleAddToBasket = (product: Product) => {
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
    this.setState({
      authOpen: true,
      pendingProduct: null,
      authInitialTab: 'signup',
      authInitialSignupEntityType: 'LEGAL_ENTITY',
      authEditingUser: null,
    });
  };

  handleUserEditClick = () => {
    if (!this.state.user) {
      return;
    }

    this.setState({
      authOpen: true,
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

  render() {
    const i18n = this.context;
    if (!i18n) {
      throw new Error('App must be used within I18nProvider');
    }

    const {
      user,
      basket,
      authOpen,
      authInitialTab,
      authInitialSignupEntityType,
      authEditingUser,
      pendingProduct,
    } = this.state;
    const basketCount = basket.reduce((sum, i) => sum + i.qty, 0);

    return (
      <div className="app">
        <Navbar
          user={user}
          basketCount={basketCount}
          onUserClick={this.handleUserEditClick}
        />
        <main>
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
            pendingProductName={pendingProduct?.name ?? null}
            initialTab={authInitialTab}
            initialSignupEntityType={authInitialSignupEntityType}
            editingUser={authEditingUser}
          />
        )}
      </div>
    );
  }
}

export default App;
