import React from 'react';
import { User } from '../App';
import { I18nContext, type I18nContextValue } from '../i18n/I18nContext';

const API_URL = `${import.meta.env.VITE_API_BASE_URL}/graphql`;

interface AuthModalProps {
  onSuccess: (user: User) => void;
  onClose: () => void;
  pendingProductName: string | null;
}

type Tab = 'login' | 'signup';

interface AuthModalState {
  tab: Tab;
  loading: boolean;
  error: string | null;
  loginEmail: string;
  loginPassword: string;
  signupName: string;
  signupFullName: string;
  signupEmail: string;
  signupPhone: string;
  signupPassword: string;
}

async function gql<T>(query: string, variables: Record<string, unknown>): Promise<T> {
  const res = await fetch(API_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    credentials: 'include',
    body: JSON.stringify({ query, variables }),
  });
  const json = await res.json();
  if (json.errors?.length) throw new Error(json.errors[0].message);
  return json.data as T;
}

const LOGIN_MUTATION = `
  mutation Login($email: String!, $password: String!) {
    login(email: $email, password: $password) {
      id name fullName email phone
    }
  }
`;

const SIGNUP_MUTATION = `
  mutation CreateUser($input: CreateUserInput!) {
    createUser(input: $input) {
      id name fullName email phone
    }
  }
`;

class AuthModal extends React.Component<AuthModalProps, AuthModalState> {
  static contextType = I18nContext;
  declare context: I18nContextValue | null;

  state: AuthModalState = {
    tab: 'login',
    loading: false,
    error: null,
    loginEmail: '',
    loginPassword: '',
    signupName: '',
    signupFullName: '',
    signupEmail: '',
    signupPhone: '',
    signupPassword: '',
  };

  handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    const i18n = this.context;
    if (!i18n) {
      throw new Error('AuthModal must be used within I18nProvider');
    }

    const { onSuccess } = this.props;
    const { dictionary } = i18n;
    const { loginEmail, loginPassword } = this.state;

    this.setState({ error: null, loading: true });
    try {
      const data = await gql<{ login: User }>(LOGIN_MUTATION, {
        email: loginEmail,
        password: loginPassword,
      });
      onSuccess(data.login);
    } catch (err: unknown) {
      this.setState({
        error: err instanceof Error ? err.message : dictionary.auth.loginFailed,
      });
    } finally {
      this.setState({ loading: false });
    }
  };

  handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    const i18n = this.context;
    if (!i18n) {
      throw new Error('AuthModal must be used within I18nProvider');
    }

    const { onSuccess } = this.props;
    const { dictionary } = i18n;
    const {
      signupName,
      signupFullName,
      signupEmail,
      signupPhone,
      signupPassword,
    } = this.state;

    this.setState({ error: null, loading: true });
    try {
      const data = await gql<{ createUser: User }>(SIGNUP_MUTATION, {
        input: {
          name: signupName,
          fullName: signupFullName,
          email: signupEmail,
          phone: signupPhone || undefined,
          password: signupPassword,
        },
      });
      onSuccess(data.createUser);
    } catch (err: unknown) {
      this.setState({
        error: err instanceof Error ? err.message : dictionary.auth.signupFailed,
      });
    } finally {
      this.setState({ loading: false });
    }
  };

  switchTab = (tab: Tab) => {
    this.setState({ tab, error: null });
  };

  render() {
    const i18n = this.context;
    if (!i18n) {
      throw new Error('AuthModal must be used within I18nProvider');
    }

    const { dictionary } = i18n;
    const { onClose, pendingProductName } = this.props;
    const {
      tab,
      loading,
      error,
      loginEmail,
      loginPassword,
      signupName,
      signupFullName,
      signupEmail,
      signupPhone,
      signupPassword,
    } = this.state;

    return (
      <div
        className="modal-overlay"
        onClick={e => e.target === e.currentTarget && onClose()}
      >
      <div className="modal" role="dialog" aria-modal="true">
        <div className="modal-header">
          <div className="modal-header-text">
            <h2>
              {tab === 'login'
                ? dictionary.auth.welcomeBack
                : dictionary.auth.createAccount}
            </h2>
            {pendingProductName && (
              <p>
                {dictionary.auth.addToBasketPrompt.replace(
                  '{product}',
                  pendingProductName
                )}
              </p>
            )}
          </div>
          <button
            className="modal-close"
            onClick={onClose}
            aria-label={dictionary.auth.close}
          >
            ✕
          </button>
        </div>

        <div className="modal-tabs">
          <button
            className={`modal-tab ${tab === 'login' ? 'active' : ''}`}
            onClick={() => this.switchTab('login')}
          >
            {dictionary.auth.loginTab}
          </button>
          <button
            className={`modal-tab ${tab === 'signup' ? 'active' : ''}`}
            onClick={() => this.switchTab('signup')}
          >
            {dictionary.auth.signupTab}
          </button>
        </div>

        {tab === 'login' ? (
          <form className="modal-form" onSubmit={this.handleLogin}>
            <input
              className="form-input"
              type="email"
              placeholder={dictionary.auth.email}
              value={loginEmail}
              onChange={e => this.setState({ loginEmail: e.target.value })}
              required
              autoComplete="email"
            />
            <input
              className="form-input"
              type="password"
              placeholder={dictionary.auth.password}
              value={loginPassword}
              onChange={e => this.setState({ loginPassword: e.target.value })}
              required
              autoComplete="current-password"
            />
            {error && <div className="modal-error">{error}</div>}
            <button className="btn-primary" type="submit" disabled={loading}>
              {loading
                ? dictionary.auth.submitLoginLoading
                : dictionary.auth.submitLogin}
            </button>
          </form>
        ) : (
          <form className="modal-form" onSubmit={this.handleSignup}>
            <div className="form-row">
              <input
                className="form-input"
                type="text"
                placeholder={dictionary.auth.username}
                value={signupName}
                onChange={e => this.setState({ signupName: e.target.value })}
                required
              />
              <input
                className="form-input"
                type="tel"
                placeholder={dictionary.auth.phoneOptional}
                value={signupPhone}
                onChange={e => this.setState({ signupPhone: e.target.value })}
              />
            </div>
            <input
              className="form-input"
              type="text"
              placeholder={dictionary.auth.fullName}
              value={signupFullName}
              onChange={e => this.setState({ signupFullName: e.target.value })}
              required
            />
            <input
              className="form-input"
              type="email"
              placeholder={dictionary.auth.email}
              value={signupEmail}
              onChange={e => this.setState({ signupEmail: e.target.value })}
              required
              autoComplete="email"
            />
            <input
              className="form-input"
              type="password"
              placeholder={dictionary.auth.password}
              value={signupPassword}
              onChange={e => this.setState({ signupPassword: e.target.value })}
              required
              autoComplete="new-password"
              minLength={8}
            />
            {error && <div className="modal-error">{error}</div>}
            <button className="btn-primary" type="submit" disabled={loading}>
              {loading
                ? dictionary.auth.submitSignupLoading
                : dictionary.auth.submitSignup}
            </button>
          </form>
        )}
      </div>
      </div>
    );
  }
}

export default AuthModal;
