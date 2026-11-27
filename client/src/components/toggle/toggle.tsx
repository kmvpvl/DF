import './toggle.css';
import Proto, { IProtoProps, IProtoState } from '../../proto';

interface IToggleProps extends IProtoProps {
  defaultChecked: boolean;
  onChange: (checked: boolean) => void;
}

interface IToggleState extends IProtoState {
  checked: boolean;
}

export class Toggle extends Proto<IToggleProps, IToggleState> {
  constructor(props: IToggleProps) {
    super(props);
    this.state = {
      checked: props.defaultChecked,
    };
  }

  handleToggle = () => {
    this.setState((prevState) => ({ checked: !prevState.checked }));
    this.props.onChange(!this.state.checked);
  };

  render() {
    const { checked } = this.state;

    return (
      <div className="toggle-component-toggle">
        <span
          className={`toggle-component-toggle__label ${!checked ? 'is-active' : ''}`}
          onClick={() => this.props.onChange(false)}
        >
          {this.ML('All products').toString()}
        </span>

        <button
          type="button"
          role="switch"
          aria-checked={checked}
          aria-label="Переключить отображение товаров в наличии"
          className={`toggle-component-toggle__track ${checked ? 'is-checked' : ''}`}
          onClick={this.handleToggle}
        >
          <span className="toggle-component-toggle__thumb" />
        </button>

        <span
          className={`toggle-component-toggle__label ${checked ? 'is-active' : ''}`}
          onClick={() => this.props.onChange(true)}
        >
          {this.ML('Only in stock').toString()}
        </span>
      </div>
    );
  }
}
