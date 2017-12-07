import { bind } from 'decko';
import { Component } from 'preact';

export class Builder extends Component {
  constructor () {
    super(arguments);
    this.state = {
      valid: true,
      readOnly: false,
      requestFocus: () => {},
      requestBlur: () => {},
      requestTransition: () => {},
      requestRewind: () => {}
    };
  }

  cleanupListeners () {
    if (this.state.machine) {
      this.state.machine.removeListener('state change', this.onTransition);
      this.state.machine.removeListener('state change failed', this.onTransitionFailed);
    }
  }

  componentWillUnmount () {
    this.cleanupListeners();
  }

  processProps (props) {
    const {
      machine,
      machineState,
      requestTransition,
      requestRewind,
      readOnly,
      blank,
      focused,
      requestFocus,
      requestBlur
    } = props;
    if (machine !== this.state.machine) {
      this.cleanupListeners();
      this.setState({
        machine: machine
      });
      machine.on('state changed', this.onTransition);
      machine.on('state change failed', this.onTransitionFailed);
    }
    if (machineState !== this.state.machineState) {
      this.setState({
        machineState: machineState
      });
    }
    if (readOnly !== this.state.readOnly) {
      this.setState({
        readOnly: readOnly
      });
    }
    if (blank !== this.state.blank) {
      this.setState({
        blank: blank
      });
    }
    if (requestTransition !== this.state.requestTransition) {
      this.setState({
        requestTransition: requestTransition
      });
    }
    if (requestRewind !== this.state.requestRewind) {
      this.setState({
        requestRewind: requestRewind
      });
    }
    if (focused) {
      setTimeout(() => { this.focus(); });
    }
    if (requestFocus !== this.state.requestFocus) {
      this.setState({
        requestFocus: requestFocus
      });
    }
    if (requestBlur !== this.state.requestBlur) {
      this.setState({
        requestBlur: requestBlur
      });
    }
  }

  componentWillMount () {
    this.processProps(this.props);
  }

  componentWillReceiveProps (nextProps) {
    this.processProps(nextProps);
  }

  @bind
  onTransition () {
    this.setState({valid: true, errorMsg: undefined});
  }

  @bind
  onTransitionFailed (reason) {
    this.setState({valid: false, errorMsg: reason.message});
  }

  @bind
  requestTransition () {
    this.state.requestTransition();
  }

  @bind
  requestRewind () {
    this.state.requestRewind();
  }

  focus () {
    // override in subclass
  }

  blur () {
    // override in subclass
  }

  @bind
  requestFocus () {
    this.state.requestFocus();
  }

  @bind
  requestBlur (e) {
    if (!e.relatedTarget || !e.relatedTarget.classList.contains('lex-box')) {
      this.state.requestBlur();
    }
  }

  renderReadOnly (props, state) {
    return (
      <span className={state.valid ? 'token-input' : 'token-input invalid'}>{this.unboxedValue}</span>
    );
  }

  renderInteractive (props, state) {
    throw new Error(`${this.constructor.name} must implement renderInteractive()`);
  }

  render (props, state) {
    return state.readOnly ? this.renderReadOnly(props, state) : this.renderInteractive(props, state);
  }

  /**
   * @returns {boolean} Returns `true` iff this `State` is valid. Should throw an exception with information about validation error otherwise.
   */
  get isValid () {
    this.state.machineState.isValid();
  }

  /**
   * @returns {any} The current (boxed) value from this `State`.
   */
  get value () {
    return this.state.machineState.value;
  }

  /**
   * @returns {any} The current (boxed) value from this `State`. An alias for this.value getter.
   */
  get boxedValue () {
    return this.value;
  }

  /**
   * @returns {any} The current (unboxed) value from this `State`.
   */
  get unboxedValue () {
    return this.state.machineState.unboxedValue;
  }

  /**
   * @param {any} newVal - A new (boxed) value for this `State`.
   */
  set value (newVal) {
    this.state.machineState.value = newVal;
  }

  /**
   * @param {any} newBoxedVal - A new (boxed) value for this `State`. Alias for this.value setter.
   */
  set boxedValue (newBoxedVal) {
    this.state.machineState.boxedValue = newBoxedVal;
  }

  /**
   * @param {any} newUnboxedVal - A new (unboxed) value for this `State`.
   */
  set unboxedValue (newUnboxedVal) {
    this.state.machineState.unboxedValue = newUnboxedVal;
  }

  /**
   * @returns {any} The (boxed) default value from this `State`.
   */
  get defaultValue () {
    return this.state.machineState.defaultValue;
  }
}
