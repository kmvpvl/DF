/// <reference types="vitest/globals" />
// @vitest-environment jsdom
import '@testing-library/jest-dom/vitest';
import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { I18nContext, type I18nContextValue } from '../../i18n/I18nContext';
import { dictionaries } from '../../i18n/dictionaries';
import PushNotificationControl from '../PushNotificationControl';
import Home from './Home';

describe('Home push notification control', () => {
  afterEach(() => {
    cleanup();
    vi.unstubAllGlobals();
  });

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
          onPushUnsubscribe={vi.fn()}
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

  it('switches the same button to unsubscribe when subscribed', () => {
    const onPushSubscribe = vi.fn();
    renderHome(true, false, onPushSubscribe);
    fireEvent.click(
      screen.getByRole('button', { name: 'Enable push notifications' })
    );
    expect(onPushSubscribe).toHaveBeenCalledOnce();

    cleanup();
    renderHome(true, true);
    expect(screen.queryByRole('status')).not.toBeInTheDocument();
    expect(
      screen.queryByRole('button', { name: 'Enable push notifications' })
    ).not.toBeInTheDocument();
    expect(
      screen.getByRole('button', { name: 'Disable push notifications' })
    ).toBeVisible();
  });

  it('uses the existing ML strings for translated notification labels', () => {
    render(
      <I18nContext.Provider value={{ ...i18nValue, language: 'sr' }}>
        <PushNotificationControl
          isSubscribed
          onSubscribe={vi.fn()}
          onUnsubscribe={vi.fn()}
        />
      </I18nContext.Provider>
    );

    expect(
      screen.getByRole('button', { name: 'Disable push notifications' })
    ).toBeInTheDocument();
  });

  it('asks before unsubscribing this device', () => {
    const onUnsubscribe = vi.fn();
    const confirm = vi.fn(() => true);
    vi.stubGlobal('confirm', confirm);
    render(
      <I18nContext.Provider value={i18nValue}>
        <PushNotificationControl
          isSubscribed
          onSubscribe={vi.fn()}
          onUnsubscribe={onUnsubscribe}
        />
      </I18nContext.Provider>
    );

    fireEvent.click(
      screen.getByRole('button', { name: 'Disable push notifications' })
    );

    expect(confirm).toHaveBeenCalledWith(
      'Are you sure you want to unsubscribe from push notifications on this device?'
    );
    expect(onUnsubscribe).toHaveBeenCalledOnce();
  });
});
