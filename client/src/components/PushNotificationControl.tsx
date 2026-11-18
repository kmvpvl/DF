import Proto, { type IProtoProps, type IProtoState } from '../proto';

interface PushNotificationControlProps extends IProtoProps {
  isSubscribed: boolean;
  onSubscribe: () => void;
}

export default class PushNotificationControl extends Proto<
  PushNotificationControlProps,
  IProtoState
> {
  render() {
    const { isSubscribed, onSubscribe } = this.props;
    if (isSubscribed) {
      return (
        <span className="push-notifications-status" role="status">
          <span className="push-notifications-check" aria-hidden="true">
            ✓
          </span>
          {this.ML('Push notifications enabled')}
        </span>
      );
    }

    return (
      <button
        className="push-notifications-button"
        type="button"
        onClick={onSubscribe}
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
        {this.ML('Enable push notifications')}
      </button>
    );
  }
}
