import React from 'react';
import { I18nContext, type I18nContextValue } from '../../i18n/I18nContext';

interface HomeProps {
  onLegalEntityCtaClick: () => void;
}

class Home extends React.Component<HomeProps> {
  static contextType = I18nContext;
  declare context: I18nContextValue | null;

  scrollTo = (id: string) => {
    document.getElementById(id)?.scrollIntoView({ behavior: 'smooth' });
  };

  handleFreeTestBatchClick = () => {
    window.localStorage.setItem('dolceforte.contactRequestType', 'FREE_TEST_BATCH');
    this.scrollTo('contacts');
  };

  render() {
    const i18n = this.context;
    if (!i18n) {
      throw new Error('Home must be used within I18nProvider');
    }

    const { dictionary } = i18n;

    return (
      <div id="home" className="hero">
        <p className="section-label">{dictionary.home.label}</p>
        <h1 className="hero-title">
          {dictionary.home.titleStart}{' '}
          <span>{dictionary.home.titleAccent}</span>,
          <br />
          {dictionary.home.titleEnd}
        </h1>
        <p className="hero-subtitle">{dictionary.home.subtitle}</p>
        <div className="hero-cta">
          <button
            className="btn-primary"
            onClick={() => this.scrollTo('products')}
          >
            {dictionary.home.shopNow}
          </button>
          <button
            className="btn-primary"
            onClick={this.props.onLegalEntityCtaClick}
          >
            {dictionary.products.legalEntityCta}
          </button>
          <button
            className="btn-primary"
            onClick={this.handleFreeTestBatchClick}
          >
            {dictionary.home.orderTestBatchFree}
          </button>
          <button
            className="btn-outline"
            onClick={() => this.scrollTo('about')}
          >
            {dictionary.home.ourStory}
          </button>
        </div>
      </div>
    );
  }
}

export default Home;
