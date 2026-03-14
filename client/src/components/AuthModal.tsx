import React from 'react';
import { User } from '../App';
import { I18nContext, type I18nContextValue } from '../i18n/I18nContext';

const API_URL = `${import.meta.env.VITE_API_BASE_URL}/graphql`;

interface AuthModalProps {
  onSuccess: (user: User) => void;
  onClose: () => void;
  pendingProductName: string | null;
  initialTab?: Tab;
  initialSignupEntityType?: 'INDIVIDUAL' | 'LEGAL_ENTITY';
  editingUser?: User | null;
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
  signupEntityType: 'INDIVIDUAL' | 'LEGAL_ENTITY';
  signupPib: string;
  signupMbr: string;
  signupAccount: string;
  signupBank: string;
  signupEmail: string;
  signupPhone: string;
  signupPassword: string;
}

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
  if (json.errors?.length) throw new Error(json.errors[0].message);
  return json.data as T;
}

const LOGIN_MUTATION = `
  mutation Login($email: String!, $password: String!) {
    login(email: $email, password: $password) {
      id name fullName entityType email phone pib mbr account bank
    }
  }
`;

const SIGNUP_MUTATION = `
  mutation CreateUser($input: CreateUserInput!) {
    createUser(input: $input) {
      id name fullName entityType email phone pib mbr account bank
    }
  }
`;

const UPDATE_SESSION_USER_MUTATION = `
  mutation UpdateSessionUser($input: UpdateSessionUserInput!) {
    updateSessionUser(input: $input) {
      id name fullName entityType email phone pib mbr account bank
    }
  }
`;

class AuthModal extends React.Component<AuthModalProps, AuthModalState> {
  static contextType = I18nContext;
  declare context: I18nContextValue | null;

  componentDidMount() {
    this.applyInitialAuthMode();
  }

  componentDidUpdate(prevProps: AuthModalProps) {
    if (
      prevProps.initialTab !== this.props.initialTab ||
      prevProps.initialSignupEntityType !== this.props.initialSignupEntityType ||
      prevProps.editingUser !== this.props.editingUser
    ) {
      this.applyInitialAuthMode();
    }
  }

  private applyInitialAuthMode = () => {
    if (this.props.editingUser) {
      const { editingUser } = this.props;

      this.setState({
        tab: 'signup',
        error: null,
        signupName: editingUser.name,
        signupFullName: editingUser.fullName,
        signupEntityType: editingUser.entityType,
        signupPib: editingUser.pib ?? '',
        signupMbr: editingUser.mbr ?? '',
        signupAccount: editingUser.account ?? '',
        signupBank: editingUser.bank ?? '',
        signupEmail: editingUser.email,
        signupPhone: editingUser.phone ?? '',
        signupPassword: '',
      });
      return;
    }

    const tab = this.props.initialTab ?? 'login';
    const signupEntityType =
      this.props.initialSignupEntityType ?? 'INDIVIDUAL';

    this.setState({
      tab,
      error: null,
      signupEntityType,
      signupName: '',
      signupFullName: '',
      signupPib: '',
      signupMbr: '',
      signupAccount: '',
      signupBank: '',
      signupEmail: '',
      signupPhone: '',
      signupPassword: '',
    });
  };

  state: AuthModalState = {
    tab: 'login',
    loading: false,
    error: null,
    loginEmail: '',
    loginPassword: '',
    signupName: '',
    signupFullName: '',
    signupEntityType: 'INDIVIDUAL',
    signupPib: '',
    signupMbr: '',
    signupAccount: '',
    signupBank: '',
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
      signupEntityType,
      signupPib,
      signupMbr,
      signupAccount,
      signupBank,
      signupEmail,
      signupPhone,
      signupPassword,
    } = this.state;

    if (
      signupEntityType === 'LEGAL_ENTITY' &&
      (!signupPib.trim() ||
        !signupMbr.trim() ||
        !signupAccount.trim() ||
        !signupBank.trim())
    ) {
      this.setState({
        loading: false,
        error: dictionary.auth.legalEntityFieldsRequired,
      });
      return;
    }

    this.setState({ error: null, loading: true });
    try {
      const data = await gql<{ createUser: User }>(SIGNUP_MUTATION, {
        input: {
          name: signupName,
          fullName: signupFullName,
          entityType: signupEntityType,
          email: signupEmail,
          phone: signupPhone || undefined,
          pib: signupEntityType === 'LEGAL_ENTITY' ? signupPib : undefined,
          mbr: signupEntityType === 'LEGAL_ENTITY' ? signupMbr : undefined,
          account:
            signupEntityType === 'LEGAL_ENTITY' ? signupAccount : undefined,
          bank: signupEntityType === 'LEGAL_ENTITY' ? signupBank : undefined,
          password: signupPassword,
        },
      });
      onSuccess(data.createUser);
    } catch (err: unknown) {
      this.setState({
        error:
          err instanceof Error ? err.message : dictionary.auth.signupFailed,
      });
    } finally {
      this.setState({ loading: false });
    }
  };

  handleProfileUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    const i18n = this.context;
    if (!i18n) {
      throw new Error('AuthModal must be used within I18nProvider');
    }

    if (!this.props.editingUser) {
      return;
    }

    const { onSuccess } = this.props;
    const { dictionary } = i18n;
    const {
      signupName,
      signupFullName,
      signupEntityType,
      signupPib,
      signupMbr,
      signupAccount,
      signupBank,
      signupEmail,
      signupPhone,
    } = this.state;

    if (
      signupEntityType === 'LEGAL_ENTITY' &&
      (!signupPib.trim() ||
        !signupMbr.trim() ||
        !signupAccount.trim() ||
        !signupBank.trim())
    ) {
      this.setState({
        loading: false,
        error: dictionary.auth.legalEntityFieldsRequired,
      });
      return;
    }

    this.setState({ error: null, loading: true });
    try {
      const data = await gql<{ updateSessionUser: User }>(
        UPDATE_SESSION_USER_MUTATION,
        {
          input: {
            name: signupName,
            fullName: signupFullName,
            entityType: signupEntityType,
            email: signupEmail,
            phone: signupPhone || undefined,
            pib: signupEntityType === 'LEGAL_ENTITY' ? signupPib : null,
            mbr: signupEntityType === 'LEGAL_ENTITY' ? signupMbr : null,
            account: signupEntityType === 'LEGAL_ENTITY' ? signupAccount : null,
            bank: signupEntityType === 'LEGAL_ENTITY' ? signupBank : null,
          },
        }
      );

      onSuccess(data.updateSessionUser);
    } catch (err: unknown) {
      this.setState({
        error:
          err instanceof Error ? err.message : dictionary.auth.updateFailed,
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
    const { onClose, pendingProductName, editingUser } = this.props;
    const {
      tab,
      loading,
      error,
      loginEmail,
      loginPassword,
      signupName,
      signupFullName,
      signupEntityType,
      signupPib,
      signupMbr,
      signupAccount,
      signupBank,
      signupEmail,
      signupPhone,
      signupPassword,
    } = this.state;

    const isLegalEntity = signupEntityType === 'LEGAL_ENTITY';
    const isEditMode = Boolean(editingUser);

    return (
      <div
        className="modal-overlay"
        onClick={(e) => e.target === e.currentTarget && onClose()}
      >
        <div className="modal" role="dialog" aria-modal="true">
          <div className="modal-header">
            <div className="modal-header-text">
              <h2>
                {isEditMode
                  ? dictionary.auth.editProfile
                  : tab === 'login'
                  ? dictionary.auth.welcomeBack
                  : dictionary.auth.createAccount}
              </h2>
              {isEditMode ? (
                <p>{dictionary.auth.editProfileDescription}</p>
              ) : pendingProductName && (
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

          {!isEditMode && (
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
          )}

          {!isEditMode && tab === 'login' ? (
            <form className="modal-form" onSubmit={this.handleLogin}>
              <input
                className="form-input"
                type="email"
                placeholder={dictionary.auth.email}
                value={loginEmail}
                onChange={(e) => this.setState({ loginEmail: e.target.value })}
                required
                autoComplete="email"
              />
              <input
                className="form-input"
                type="password"
                placeholder={dictionary.auth.password}
                value={loginPassword}
                onChange={(e) =>
                  this.setState({ loginPassword: e.target.value })
                }
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
            <form
              className="modal-form"
              onSubmit={isEditMode ? this.handleProfileUpdate : this.handleSignup}
            >
              <div className="form-row">
                <input
                  className="form-input"
                  type="text"
                  placeholder={dictionary.auth.username}
                  value={signupName}
                  onChange={(e) =>
                    this.setState({ signupName: e.target.value })
                  }
                  required
                />
                <input
                  className="form-input"
                  type="tel"
                  placeholder={dictionary.auth.phoneOptional}
                  value={signupPhone}
                  onChange={(e) =>
                    this.setState({ signupPhone: e.target.value })
                  }
                />
              </div>
              <input
                className="form-input"
                type="text"
                placeholder={dictionary.auth.fullName}
                value={signupFullName}
                onChange={(e) =>
                  this.setState({ signupFullName: e.target.value })
                }
                required
              />
              <select
                className="form-input"
                value={signupEntityType}
                onChange={(e) =>
                  this.setState({
                    signupEntityType: e.target.value as
                      | 'INDIVIDUAL'
                      | 'LEGAL_ENTITY',
                  })
                }
                aria-label={dictionary.auth.buyerType}
              >
                <option value="INDIVIDUAL">
                  {dictionary.auth.individual}
                </option>
                <option value="LEGAL_ENTITY">
                  {dictionary.auth.legalEntity}
                </option>
              </select>
              {isLegalEntity && (
                <>
                  <input
                    className="form-input"
                    type="text"
                    placeholder={dictionary.auth.pib}
                    value={signupPib}
                    onChange={(e) =>
                      this.setState({ signupPib: e.target.value })
                    }
                    required={isLegalEntity}
                  />
                  <input
                    className="form-input"
                    type="text"
                    placeholder={dictionary.auth.mbr}
                    value={signupMbr}
                    onChange={(e) =>
                      this.setState({ signupMbr: e.target.value })
                    }
                    required={isLegalEntity}
                  />
                  <input
                    className="form-input"
                    type="text"
                    placeholder={dictionary.auth.account}
                    value={signupAccount}
                    onChange={(e) =>
                      this.setState({ signupAccount: e.target.value })
                    }
                    required={isLegalEntity}
                  />
                  <input
                    className="form-input"
                    type="text"
                    placeholder={dictionary.auth.bank}
                    value={signupBank}
                    onChange={(e) =>
                      this.setState({ signupBank: e.target.value })
                    }
                    required={isLegalEntity}
                  />
                </>
              )}
              <input
                className="form-input"
                type="email"
                placeholder={dictionary.auth.email}
                value={signupEmail}
                onChange={(e) => this.setState({ signupEmail: e.target.value })}
                required
                autoComplete="email"
              />
              {!isEditMode && (
                <input
                  className="form-input"
                  type="password"
                  placeholder={dictionary.auth.password}
                  value={signupPassword}
                  onChange={(e) =>
                    this.setState({ signupPassword: e.target.value })
                  }
                  required
                  autoComplete="new-password"
                  minLength={8}
                />
              )}
              {error && <div className="modal-error">{error}</div>}
              <button className="btn-primary" type="submit" disabled={loading}>
                {isEditMode
                  ? loading
                    ? dictionary.auth.submitProfileUpdateLoading
                    : dictionary.auth.submitProfileUpdate
                  : loading
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
