import React from 'react';
import { I18nContext, type I18nContextValue } from '../../i18n/I18nContext';

interface ContactsState {
  sent: boolean;
}

class Contacts extends React.Component<Record<string, never>, ContactsState> {
  static contextType = I18nContext;
  declare context: I18nContextValue | null;

  state: ContactsState = {
    sent: false,
  };

  handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    this.setState({ sent: true });
  };

  render() {
    const i18n = this.context;
    if (!i18n) {
      throw new Error('Contacts must be used within I18nProvider');
    }

    const { dictionary } = i18n;

    return (
      <div id="contacts" className="contacts-section">
        <div className="section-inner">
          <p className="section-label">{dictionary.contacts.label}</p>
          <h2 className="section-title">{dictionary.contacts.title}</h2>

          <div className="contacts-grid">
            <div className="contact-info">
              <div className="contact-item">
                <span className="contact-icon">📍</span>
                <div>
                  <strong>{dictionary.contacts.addressLabel}</strong>
                  <span>{dictionary.contacts.addressValue}</span>
                </div>
              </div>
              <div className="contact-item">
                <span className="contact-icon">📞</span>
                <div>
                  <strong>{dictionary.contacts.phoneLabel}</strong>
                  <span>{dictionary.contacts.phoneValue}</span>
                </div>
              </div>
              <div className="contact-item">
                <span className="contact-icon">✉️</span>
                <div>
                  <strong>{dictionary.contacts.emailLabel}</strong>
                  <span>{dictionary.contacts.emailValue}</span>
                </div>
              </div>
              <div className="contact-item">
                <span className="contact-icon">🕐</span>
                <div>
                  <strong>{dictionary.contacts.hoursLabel}</strong>
                  <span>
                    {dictionary.contacts.hoursLine1}
                    <br />
                    {dictionary.contacts.hoursLine2}
                  </span>
                </div>
              </div>
            </div>

            <div>
              {this.state.sent ? (
                <p
                  style={{
                    color: 'var(--primary)',
                    fontWeight: 600,
                    fontSize: '1.05rem',
                  }}
                >
                  ✓ {dictionary.contacts.sent}
                </p>
              ) : (
                <form className="contact-form" onSubmit={this.handleSubmit}>
                  <div className="form-row">
                    <input
                      className="form-input"
                      type="text"
                      placeholder={dictionary.contacts.yourName}
                      required
                    />
                    <input
                      className="form-input"
                      type="email"
                      placeholder={dictionary.contacts.email}
                      required
                    />
                  </div>
                  <input
                    className="form-input"
                    type="text"
                    placeholder={dictionary.contacts.subject}
                  />
                  <textarea
                    className="form-input"
                    placeholder={dictionary.contacts.message}
                    required
                  />
                  <button className="btn-primary" type="submit">
                    {dictionary.contacts.send}
                  </button>
                </form>
              )}
            </div>
          </div>
        </div>
      </div>
    );
  }
}

export default Contacts;
