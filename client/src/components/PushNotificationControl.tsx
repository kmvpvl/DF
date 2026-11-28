import Proto, { type IProtoProps, type IProtoState } from '../proto';

interface PushNotificationControlProps extends IProtoProps {
  isSubscribed: boolean;
  onSubscribe: () => void | Promise<void>;
  onUnsubscribe: () => void | Promise<void>;
}

export default class PushNotificationControl extends Proto<
  PushNotificationControlProps,
  IProtoState
> {
  render() {
    const { isSubscribed, onSubscribe, onUnsubscribe } = this.props;
    return (
      <button
        className="push-notifications-button"
        type="button"
        onClick={() => {
          if (!isSubscribed) {
            void onSubscribe();
            return;
          }

          if (
            window.confirm(
              this.ML(
                'Are you sure you want to unsubscribe from push notifications on this device?'
              ).toString()
            )
          ) {
            void onUnsubscribe();
          }
        }}
      >
        <svg
          aria-hidden="true"
          className="push-notifications-icon"
          viewBox="0 0 24 24"
          fill="none"
        >
          <path
            d="M18 8a6 6 0 0 0-12 0c0 7-3 7-3 9h18c0-2-3-2-3-9ZM10 21h4"
            stroke="currentColor"
            strokeWidth="1.8"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
        {this.ML(
          isSubscribed
            ? 'Disable push notifications'
            : 'Enable push notifications'
        )}
      </button>
    );
  }
}
