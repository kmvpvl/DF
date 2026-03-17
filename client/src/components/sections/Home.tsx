import { I18nContext, type I18nContextValue } from '../../i18n/I18nContext';
import Proto from '../../proto';

interface HomeProps {
  onLegalEntityCtaClick: () => void;
  userEntityType: 'INDIVIDUAL' | 'LEGAL_ENTITY' | null;
}

class Home extends Proto<HomeProps, {}> {
  static contextType = I18nContext;
  declare context: I18nContextValue | null;

  scrollTo = (id: string) => {
    document.getElementById(id)?.scrollIntoView({ behavior: 'smooth' });
  };

  handleFreeTestBatchClick = () => {
    window.localStorage.setItem(
      'dolceforte.contactRequestType',
      'FREE_TEST_BATCH'
    );
    this.scrollTo('contacts');
  };

  render() {
    const i18n = this.context;
    if (!i18n) {
      throw new Error('Home must be used within I18nProvider');
    }

    return (
      <div id="home" className="hero">
        <p className="section-label">
          {this.ML(
            'Production of Italian and Russian desserts, cheese and cottage cheese'
          ).toString()}
        </p>
        <h1 className="hero-title">
          {this.ML('Crafted with').toString()}{' '}
          <span>{this.ML('Love').toString()}</span>,
          <br />
          {this.ML('Baked to Perfection').toString()}
        </h1>
        <p className="hero-subtitle">
          {this.ML(
            'We produce desserts and cheeses for end consumers, stores, restaurants and catering. Delivery to Pančevo, Belgrade and surrounding areas'
          ).toString()}
        </p>
        <div className="hero-cta">
          <button
            className="btn-primary"
            onClick={() => this.scrollTo('products')}
          >
            {this.ML('Shop Now').toString()}
          </button>
          {this.props.userEntityType !== 'LEGAL_ENTITY' && (
            <button
              className="btn-primary"
              onClick={this.props.onLegalEntityCtaClick}
            >
              {this.ML(
                'Login as a legal entity to get great prices'
              ).toString()}
            </button>
          )}
          <button
            className="btn-primary"
            onClick={this.handleFreeTestBatchClick}
          >
            {this.ML('Order a test batch for free').toString()}
          </button>
          <button
            className="btn-outline"
            onClick={() => this.scrollTo('about')}
          >
            {this.ML('Our Story').toString()}
          </button>
        </div>
      </div>
    );
  }
}

export default Home;
