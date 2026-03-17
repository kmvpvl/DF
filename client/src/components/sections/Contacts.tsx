import React from 'react';
import { I18nContext, type I18nContextValue } from '../../i18n/I18nContext';
import Proto from '../../proto';

const API_URL = `${import.meta.env.VITE_API_BASE_URL}/graphql`;
const CONTACT_REQUEST_TYPE_KEY = 'dolceforte.contactRequestType';

const SEND_CONTACT_MESSAGE_MUTATION = `
  mutation SendContactMessage($input: SendContactMessageInput!) {
    sendContactMessage(input: $input)
  }
`;

async function gql<T>(
  query: string,
  variables: Record<string, unknown>
): Promise<T> {
  const res = await fetch(API_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    credentials: 'include',
    body: JSON.stringify({ query, variables }),
  });

  const json = await res.json();
  if (json.errors?.length) {
    throw new Error(json.errors[0].message);
  }

  return json.data as T;
}

interface ContactsState {
  sent: boolean;
  validationError: string;
  loading: boolean;
  subject: string;
  message: string;
  requestType: 'FEEDBACK' | 'FREE_TEST_BATCH';
}

class Contacts extends Proto<Record<string, never>, ContactsState> {
  static contextType = I18nContext;
  declare context: I18nContextValue | null;

  state: ContactsState = {
    sent: false,
    validationError: '',
    loading: false,
    subject: '',
    message: '',
    requestType: 'FEEDBACK',
  };

  componentDidMount() {
    this.applyRequestTypeFromStorage();
  }

  componentDidUpdate() {
    this.applyRequestTypeFromStorage();
  }

  private applyRequestTypeFromStorage = () => {
    const storedType = window.localStorage.getItem(CONTACT_REQUEST_TYPE_KEY);
    if (storedType !== 'FREE_TEST_BATCH') {
      return;
    }

    if (this.state.requestType !== 'FREE_TEST_BATCH') {
      this.setState({
        requestType: 'FREE_TEST_BATCH',
        subject: this.state.subject || 'Free test batch request',
      });
    }

    window.localStorage.removeItem(CONTACT_REQUEST_TYPE_KEY);
  };

  handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    void this.sendContactMessage(e);
  };

  private sendContactMessage = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    const i18n = this.context;
    if (!i18n) {
      throw new Error('Contacts must be used within I18nProvider');
    }

    const formData = new FormData(e.currentTarget);
    const name = String(formData.get('name') ?? '').trim();
    const email = String(formData.get('email') ?? '').trim();
    const phone = String(formData.get('phone') ?? '').trim();
    const subject = this.state.subject.trim();
    const message = this.state.message.trim();

    if (!email && !phone) {
      this.setState({
        sent: false,
        validationError: i18n.dictionary.contacts.phoneOrEmailRequired,
      });
      return;
    }

    if (!name || !subject || !message) {
      this.setState({
        sent: false,
        validationError: 'Please fill all required fields.',
      });
      return;
    }

    this.setState({ loading: true, validationError: '' });

    try {
      await gql<{ sendContactMessage: boolean }>(
        SEND_CONTACT_MESSAGE_MUTATION,
        {
          input: {
            type: this.state.requestType,
            name,
            email: email || undefined,
            phone: phone || undefined,
            subject,
            message,
          },
        }
      );

      this.setState({
        sent: true,
        loading: false,
        validationError: '',
        subject: '',
        message: '',
        requestType: 'FEEDBACK',
      });
    } catch (error: unknown) {
      this.setState({
        sent: false,
        loading: false,
        validationError:
          error instanceof Error ? error.message : 'Failed to send message.',
      });
    }
  };

  private toTelHref = (phone: string) => `tel:${phone.replace(/\s+/g, '')}`;

  private readonly googleMapsAddressHref =
    'https://maps.app.goo.gl/XCpXndcspQjgzjB48';

  render() {
    const i18n = this.context;
    if (!i18n) {
      throw new Error('Contacts must be used within I18nProvider');
    }

    const { dictionary } = i18n;
    const { loading, message, requestType, subject } = this.state;

    return (
      <div id="contacts" className="contacts-section">
        <div className="section-inner">
          <p className="section-label">{dictionary.contacts.label}</p>

          <div className="contacts-grid">
            <div className="contact-info">
              <div className="contact-item contact-item-address">
                <span className="contact-icon">📍</span>
                <div>
                  <strong>{dictionary.contacts.addressLabel}</strong>
                  <a
                    className="contact-value-link"
                    href={this.googleMapsAddressHref}
                    target="_blank"
                    rel="noreferrer"
                  >
                    {dictionary.contacts.addressValue}
                  </a>
                  <iframe
                    className="contact-map-embed"
                    src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d1441.9934078729075!2d20.649045022660246!3d44.876563225438204!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x475a7fba29df3df9%3A0xc1707ed345358f55!2sDOLCEFORTE!5e0!3m2!1sen!2srs!4v1773484225346!5m2!1sen!2srs"
                    width="600"
                    height="450"
                    style={{ border: 0 }}
                    allowFullScreen
                    loading="lazy"
                    referrerPolicy="no-referrer-when-downgrade"
                    title="DolceForte location map"
                  />
                </div>
              </div>
              <div className="contact-item">
                <span className="contact-icon">📞</span>
                <div>
                  <strong>{dictionary.contacts.phoneLabel}</strong>
                  <a
                    className="contact-value-link"
                    href={this.toTelHref(dictionary.contacts.phoneValue)}
                  >
                    {dictionary.contacts.phoneValue}
                  </a>
                </div>
              </div>
              <div className="contact-item">
                <span className="contact-icon">✉️</span>
                <div>
                  <strong>{dictionary.contacts.emailLabel}</strong>
                  <a
                    className="contact-value-link"
                    href={`mailto:${dictionary.contacts.emailValue}`}
                  >
                    {dictionary.contacts.emailValue}
                  </a>
                </div>
              </div>
              <div className="contact-item">
                <span className="contact-icon">🧾</span>
                <div>
                  <strong>{dictionary.contacts.pibLabel}</strong>
                  <span>{dictionary.contacts.pibValue}</span>
                </div>
              </div>
              <div className="contact-item">
                <span className="contact-icon">🏢</span>
                <div>
                  <strong>{dictionary.contacts.mbrLabel}</strong>
                  <span>{dictionary.contacts.mbrValue}</span>
                </div>
              </div>
              <div className="contact-item">
                <span className="contact-icon">🏦</span>
                <div>
                  <strong>{dictionary.contacts.accountLabel}</strong>
                  <span>{dictionary.contacts.accountValue}</span>
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

            <div className="contact-form-column">
              <h2 className="section-title contact-form-title">
                {dictionary.contacts.title}
              </h2>
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
                      name="name"
                      placeholder={dictionary.contacts.yourName}
                      required
                    />
                    <input
                      className="form-input"
                      type="email"
                      name="email"
                      placeholder={dictionary.contacts.email}
                    />
                  </div>
                  <input
                    className="form-input"
                    type="tel"
                    name="phone"
                    placeholder={dictionary.contacts.phoneLabel}
                  />
                  <input
                    className="form-input"
                    type="text"
                    value={subject}
                    onChange={(event) =>
                      this.setState({ subject: event.target.value })
                    }
                    placeholder={dictionary.contacts.subject}
                    required
                  />
                  <textarea
                    className="form-input"
                    value={message}
                    onChange={(event) =>
                      this.setState({ message: event.target.value })
                    }
                    placeholder={dictionary.contacts.message}
                    required
                  />
                  {this.state.validationError && (
                    <p className="modal-error">{this.state.validationError}</p>
                  )}
                  <button
                    className="btn-primary"
                    type="submit"
                    disabled={loading}
                  >
                    {loading
                      ? `${dictionary.contacts.send}...`
                      : requestType === 'FREE_TEST_BATCH'
                        ? this.ML('Order a test batch for free').toString()
                        : dictionary.contacts.send}
                  </button>
                  <p className="feedback-destination">
                    {dictionary.contacts.feedbackDestinationLabel}{' '}
                    <a
                      className="contact-value-link"
                      href={`mailto:${dictionary.contacts.emailValue}`}
                    >
                      {dictionary.contacts.emailValue}
                    </a>
                  </p>
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
