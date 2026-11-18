/// <reference types="vitest/globals" />
// @vitest-environment jsdom
import '@testing-library/jest-dom/vitest';
import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import {
  I18nContext,
  type I18nContextValue,
} from '../../i18n/I18nContext';
import { dictionaries } from '../../i18n/dictionaries';
import Home from './Home';

describe('Home push notification control', () => {
  afterEach(cleanup);

  const i18nValue: I18nContextValue = {
    language: 'en',
    languages: ['en'],
    dictionary: dictionaries.en,
    setLanguage: vi.fn(),
  };

  const renderHome = (
    isLoggedIn: boolean,
    isPushSubscribed = false,
    onPushSubscribe = vi.fn()
  ) =>
    render(
      <I18nContext.Provider value={i18nValue}>
        <Home
          onLegalEntityCtaClick={vi.fn()}
          userEntityType={null}
          isLoggedIn={isLoggedIn}
          isPushSubscribed={isPushSubscribed}
          onPushSubscribe={onPushSubscribe}
        />
      </I18nContext.Provider>
    );

  it('only shows the subscribe button to a logged-in user', () => {
    renderHome(false);
    expect(
      screen.queryByRole('button', { name: 'Enable push notifications' })
    ).not.toBeInTheDocument();

    cleanup();
    renderHome(true);
    expect(
      screen.getByRole('button', { name: 'Enable push notifications' })
    ).toBeVisible();
  });

  it('shows the subscribed status and invokes the subscription action', () => {
    const onPushSubscribe = vi.fn();
    renderHome(true, false, onPushSubscribe);
    fireEvent.click(
      screen.getByRole('button', { name: 'Enable push notifications' })
    );
    expect(onPushSubscribe).toHaveBeenCalledOnce();

    cleanup();
    renderHome(true, true);
    expect(screen.getByRole('status')).toHaveTextContent(
      'Push notifications enabled'
    );
    expect(
      screen.queryByRole('button', { name: 'Enable push notifications' })
    ).not.toBeInTheDocument();
  });
});
