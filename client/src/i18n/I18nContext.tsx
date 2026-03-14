import React, { createContext, useContext } from 'react';
import {
  dictionaries,
  type Dictionary,
  type DictionaryLanguage,
} from './dictionaries';

const LOCAL_STORAGE_KEY = 'dolceforte.language';

const configuredLanguages: string[] = (import.meta.env.VITE_LANGUAGES ?? 'en')
  .split(',')
  .map((code: string) => code.trim().toLowerCase())
  .filter(Boolean);

const dedupedConfiguredLanguages: string[] = [...new Set(configuredLanguages)];

const defaultLanguage = (
  import.meta.env.VITE_DEFAULT_LANGUAGE ??
  dedupedConfiguredLanguages[0] ??
  'en'
)
  .trim()
  .toLowerCase();

function normalizeLanguage(code: string): string {
  if (!code) return '';
  return code.trim().toLowerCase();
}

function resolveBrowserLanguage(availableLanguages: string[]): string | null {
  if (typeof navigator === 'undefined') return null;

  const browserLanguages = [
    ...(navigator.languages ?? []),
    navigator.language,
  ].map(normalizeLanguage);

  for (const browserLanguage of browserLanguages) {
    if (availableLanguages.includes(browserLanguage)) {
      return browserLanguage;
    }

    const baseLanguage = browserLanguage.split('-')[0];
    if (availableLanguages.includes(baseLanguage)) {
      return baseLanguage;
    }
  }

  return null;
}

function getInitialLanguage(availableLanguages: string[]): string {
  const savedLanguage = normalizeLanguage(
    localStorage.getItem(LOCAL_STORAGE_KEY) ?? ''
  );

  if (availableLanguages.includes(savedLanguage)) {
    return savedLanguage;
  }

  const browserLanguage = resolveBrowserLanguage(availableLanguages);
  if (browserLanguage) {
    return browserLanguage;
  }

  if (availableLanguages.includes(defaultLanguage)) {
    return defaultLanguage;
  }

  return availableLanguages[0] ?? 'en';
}

export interface I18nContextValue {
  language: string;
  languages: string[];
  dictionary: Dictionary;
  setLanguage: (language: string) => void;
}

export const I18nContext = createContext<I18nContextValue | null>(null);

export function I18nProvider({ children }: { children: React.ReactNode }) {
  return <I18nProviderClass>{children}</I18nProviderClass>;
}

interface I18nProviderClassState {
  language: string;
}

class I18nProviderClass extends React.Component<
  { children: React.ReactNode },
  I18nProviderClassState
> {
  private readonly languages: string[] = dedupedConfiguredLanguages.length
    ? dedupedConfiguredLanguages
    : ['en'];

  constructor(props: { children: React.ReactNode }) {
    super(props);

    this.state = {
      language: getInitialLanguage(this.languages),
    };
  }

  private setLanguage = (nextLanguage: string) => {
    const normalized = normalizeLanguage(nextLanguage);
    if (!this.languages.includes(normalized)) return;
    this.setState({ language: normalized });
    localStorage.setItem(LOCAL_STORAGE_KEY, normalized);
  };

  render() {
    const { language } = this.state;
    const dictionary =
      dictionaries[language as DictionaryLanguage] ?? dictionaries.en;

    const value: I18nContextValue = {
      language,
      languages: this.languages,
      dictionary,
      setLanguage: this.setLanguage,
    };

    return (
      <I18nContext.Provider value={value}>
        {this.props.children}
      </I18nContext.Provider>
    );
  }
}

export function useI18n() {
  const context = useContext(I18nContext);
  if (!context) {
    throw new Error('useI18n must be used within I18nProvider');
  }
  return context;
}
