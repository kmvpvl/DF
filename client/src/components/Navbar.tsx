import React from 'react';
import { User } from '../App';
import { I18nContext, type I18nContextValue } from '../i18n/I18nContext';

interface NavbarProps {
  user: User | null;
  basketCount: number;
}

class Navbar extends React.Component<NavbarProps> {
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

    const { dictionary, language, languages, setLanguage } = i18n;
    const { user, basketCount } = this.props;

    const sections = [
      { id: 'home', label: dictionary.nav.home },
      { id: 'products', label: dictionary.nav.products },
      { id: 'delivery', label: dictionary.nav.delivery },
      { id: 'contacts', label: dictionary.nav.contacts },
      { id: 'about', label: dictionary.nav.about },
    ];

    return (
      <nav className="navbar">
        <div className="navbar-brand">{dictionary.common.brand}</div>

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
            <span className="language-label">{dictionary.nav.languageLabel}</span>
            <select
              className="language-select"
              value={language}
              onChange={e => setLanguage(e.target.value)}
              aria-label={dictionary.nav.languageLabel}
            >
              {languages.map(code => (
                <option key={code} value={code}>
                  {dictionary.common.languageNames[
                    code as keyof typeof dictionary.common.languageNames
                  ] ?? code.toUpperCase()}
                </option>
              ))}
            </select>
          </label>
          {user && (
            <span className="nav-user">
              {dictionary.nav.hi}, {user.name}
            </span>
          )}
          <button className="basket-btn" aria-label={dictionary.nav.basketAria}>
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
