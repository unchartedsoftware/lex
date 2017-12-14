import { bind } from 'decko';
import { h, Component } from 'preact';

/**
 * An abstract superclass for a `Component` which can be
 * used to construct a portion of a Token.
 *
 * Subclasses generally implement `renderInteractive` and `focus`.
 *
 * @example
 * // See OptionBuilder for an example implementation.
 */
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

  /**
   * If overidden, must be called via `super.cleanupListeners()`.
   */
  cleanupListeners () {
    if (this.state.machine) {
      this.state.machine.removeListener('state changed', this.onTransition);
      this.state.machine.removeListener('state change failed', this.onTransitionFailed);
    }
  }

  /**
   * If overidden, must be called via `super.connectListeners()`.
   */
  connectListeners () {
    if (this.state.machine) {
      this.state.machine.on('state changed', this.onTransition);
      this.state.machine.on('state change failed', this.onTransitionFailed);
    }
  }

  /**
   * If overidden, must be called via `super.componentWillUnmount()`.
   */
  componentWillUnmount () {
    this.cleanupListeners();
  }

  /**
   * If overidden, must be called via `super.componentDidUpdate()`.
   */
  componentDidUpdate () {
    this.connectListeners();
  }

  /**
   * If overidden, must be called via `super.componentWillMount()`.
   */
  componentWillMount () {
    this.processProps(this.props);
  }

  /**
   * If overidden, must be called via `super.componentWillReceiveProps(nextProps)`.
   *
   * @param {Object} nextProps - Incoming properties.
   */
  componentWillReceiveProps (nextProps) {
    this.cleanupListeners();
    this.processProps(nextProps);
  }

  /**
   * If overidden, must be called via `super.processProps(props)`.
   *
   * @param {Object} props - Incoming properties.
   */
  processProps (props) {
    const {
      machine,
      machineState,
      requestTransition = () => {},
      requestRewind = () => {},
      readOnly,
      blank,
      focused,
      requestFocus = () => {},
      requestBlur = () => {}
    } = props;
    if (machine !== this.state.machine) {
      this.setState({
        machine: machine
      });
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

  @bind
  onTransition () {
    this.setState({valid: true, errorMsg: undefined});
  }

  @bind
  onTransitionFailed (reason) {
    if (this.state.machineState === this.state.machine.state) {
      this.setState({valid: false, errorMsg: reason.message});
    }
  }

  @bind
  requestTransition () {
    return this.state.requestTransition();
  }

  @bind
  requestRewind () {
    return this.state.requestRewind();
  }

  /**
   * Provide this builder with focus. Must be overriden in a subclass.
   *
   * @example
   * focus () {
   *   if (this.textInput) this.textInput.focus();
   * }
   */
  focus () {
    // override in subclass
  }

  @bind
  /**
   * Call from a subclass to inform containing components that this component has received focus.
   * Since "focus" is not necessarily a literal concept (and could be triggered by a button press, or some
   * other interaction), this is an artificial bubbling mechanism.
   */
  requestFocus () {
    this.state.requestFocus();
  }

  @bind
  /**
   * Call from a subclass to inform containing components that this component has been blurred.
   * Since "focus" is not necessarily a literal concept (and could be triggered by a button press, or some
   * other interaction), this is an artificial bubbling mechanism.
   *
   * @param {Event} e - A blur event from some DOM element within this Builder's visual representation.
   */
  requestBlur (e) {
    const assistantBox = document.getElementById('assistant-box');
    if (!e.relatedTarget || assistantBox === null || !assistantBox.contains(e.relatedTarget)) {
      this.state.requestBlur();
    }
  }

  /*!
   * @private
   */
  renderReadOnly (props, state) {
    return (
      <span className={state.valid ? 'token-input' : 'token-input invalid'}>{this.unboxedValue}</span>
    );
  }

  /**
   * Render the interactive version of this `Builder`. Usually some form of `<input>`.
   * Must override in subclasses.
   *
   * @param {Object} props - Properties.
   * @param {Object} state - Component state (`this.state`).
   * @param {boolean} state.valid - True iff the value of the underlying `State` is valid.
   * @param {boolean} state.readOnly - True iff this `Builder` is in read-only mode (generally speaking, if the user has progressed past this `State` to a later one).
   * @param {State} state.machineState - The underlying `State`.
   * @example
   * renderInteractive (props, {valid, readOnly}) {
   *  return (
   *    <input
   *       ref={(input) => { this.textInput = input; }}
   *       type="text"
   *       disabled={readOnly}
   *       className={valid ? 'token-input' : 'token-input invalid'}
   *    />
   *   );
   * }
   */
  renderInteractive (props, state) { // eslint-disable-line no-unused-vars
    throw new Error(`${this.constructor.name} must implement renderInteractive()`);
  }

  /*!
   * @private
   */
  render (props, state) {
    const {readOnly, machineState} = state;
    return readOnly || machineState.isReadOnly ? this.renderReadOnly(props, state) : this.renderInteractive(props, state);
  }

  /**
   * Getter for `this.isValid`.
   *
   * @readonly
   * @returns {boolean} Returns `true` iff this `State` is valid. Should throw an exception with information about validation error otherwise.
   */
  get isValid () {
    this.state.machineState.isValid();
  }

  /**
   * @readonly
   * @returns {any} The (boxed) default value from the underlying `State`.
   */
  get defaultValue () {
    return this.state.machineState.defaultValue;
  }

  /**
   * @readonly
   * @returns {State} The underlying `State`.
   */
  get machineState () {
    return this.state.machineState;
  }

  /**
   * Getter for `this.value`.
   *
   * @returns {any} The current (boxed) value from the underlying `State`.
   */
  get value () {
    return this.state.machineState.value;
  }

  /**
   * Setter for `this.value`.
   *
   * @param {any} newVal - A new (boxed) value for the underlying `State`.
   */
  set value (newVal) {
    this.state.machineState.value = newVal;
  }

  /**
   * Getter for `this.boxedValue`.
   *
   * @returns {any} The current (boxed) value from the underlying `State`. An alias for this.value getter.
   */
  get boxedValue () {
    return this.value;
  }

  /**
   * Setter for `this.boxedValue`.
   *
   * @param {any} newBoxedVal - A new (boxed) value for the underlying `State`. Alias for this.value setter.
   */
  set boxedValue (newBoxedVal) {
    this.state.machineState.boxedValue = newBoxedVal;
  }

  /**
   * Getter for `this.unboxedValue`.
   *
   * @returns {any} The current (unboxed) value from the underlying `State`.
   */
  get unboxedValue () {
    return this.state.machineState.unboxedValue;
  }

  /**
   * Setter for `this.unboxedValue`.
   *
   * @param {any} newUnboxedVal - A new (unboxed) value for the underlying `State`.
   */
  set unboxedValue (newUnboxedVal) {
    this.state.machineState.unboxedValue = newUnboxedVal;
  }
}
