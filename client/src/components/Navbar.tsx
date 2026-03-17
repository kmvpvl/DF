import { User } from '../App';
import { I18nContext, type I18nContextValue } from '../i18n/I18nContext';
import Proto from '../proto';

interface NavbarProps {
  user: User | null;
  basketCount: number;
  onUserClick: () => void;
  onBasketClick: () => void;
}

const LANGUAGE_FLAGS: Record<string, string> = {
  en: '🇬🇧',
  ru: '🇷🇺',
  sr: '🇷🇸',
};

class Navbar extends Proto<NavbarProps, {}> {
  static contextType = I18nContext;
  declare context: I18nContextValue | null;

  scrollTo = (id: string) => {
    document.getElementById(id)?.scrollIntoView({ behavior: 'smooth' });
  };

  render() {
    const i18n = this.context;
    if (!i18n) {
      throw new Error('Navbar must be used within I18nProvider');
    }

    const { language, languages, setLanguage } = i18n;
    const { user, basketCount, onUserClick, onBasketClick } = this.props;

    const sections = [
      { id: 'home', label: this.ML('Home').toString() },
      { id: 'products', label: this.ML('Products').toString() },
      { id: 'delivery', label: this.ML('Delivery').toString() },
      { id: 'contacts', label: this.ML('Contacts').toString() },
      //Impleme{ id: 'about', label: this.ML('About').toString() },
    ];

    return (
      <nav className="navbar">
        <div className="navbar-brand">
          <img
            className="navbar-brand-logo"
            src="/assets/brand/logos/logo.png"
            alt="DolceForte"
          />
          <span className="navbar-brand-text">DolceForte</span>
        </div>

        <ul className="navbar-links">
          {sections.map(({ id, label }) => (
            <li key={id}>
              <button className="nav-link" onClick={() => this.scrollTo(id)}>
                {label}
              </button>
            </li>
          ))}
        </ul>

        <div className="navbar-right">
          <label className="language-select-wrap">
            <span className="language-label">
              {this.ML('Language').toString()}:
            </span>
            <select
              className="language-select"
              value={language}
              onChange={(e) => setLanguage(e.target.value)}
              aria-label={this.ML('Language').toString()}
            >
              {languages.map((code) => (
                <option key={code} value={code}>
                  {LANGUAGE_FLAGS[code] ?? '🌐'}
                </option>
              ))}
            </select>
          </label>
          {user && (
            <button className="nav-user-button" onClick={onUserClick}>
              <span className="nav-user">
                {this.ML('Hi').toString()}, {user.name}
              </span>
            </button>
          )}
          <button
            className="basket-btn"
            aria-label={this.ML('Basket').toString()}
            onClick={onBasketClick}
          >
            🛒
            {basketCount > 0 && (
              <span className="basket-badge">{basketCount}</span>
            )}
          </button>
        </div>
      </nav>
    );
  }
}

export default Navbar;
