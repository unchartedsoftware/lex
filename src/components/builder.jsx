import { Bind } from 'lodash-decorators';
import { h, Component } from 'preact';
import { COMMA } from '../lib/keys';

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
      editing: false,
      readOnly: false,
      tokenActive: false,
      multivalueDelimiter: COMMA,
      multivaluePasteDelimiter: ',',
      requestFocus: () => {},
      requestBlur: () => {},
      requestTransition: () => {},
      requestArchive: () => {},
      requestUnarchive: () => {},
      requestRemoveArchivedValue: () => {},
      requestRewind: () => {},
      requestCancel: () => {},
      validityChanged: () => {}
    };
  }

  /**
   * If overidden, must be called via `super.cleanupListeners()`.
   * Fires whenever the underlying machine or machine state changes.
   */
  cleanupListeners () {
    if (this.state.machine) {
      this.state.machine.removeListener('before state change', this.beforeTransition);
      this.state.machine.removeListener('state changed', this.onTransition);
      this.state.machine.removeListener('state change failed', this.onTransitionFailed);
    }
  }

  /**
   * If overidden, must be called via `super.connectListeners()`.
   * Fires whenever the underlying machine or machine state changes.
   */
  connectListeners () {
    if (this.state.machine) {
      this.state.machine.on('before state change', this.beforeTransition);
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
   * If overidden, must be called via `super.componentWillMount()`.
   */
  componentWillMount () {
    this.processProps(this.props);
    this.connectListeners();
  }

  /**
   * If overidden, must be called via `super.componentWillReceiveProps(nextProps)`.
   *
   * @param {Object} nextProps - Incoming properties.
   */
  componentWillReceiveProps (nextProps) {
    this.processProps(nextProps);
  }

  /**
   * If overidden, must be called via `super.processProps(props)`.
   *
   * @param {Object} props - Incoming properties.
   */
  processProps (props) {
    const {
      editing,
      tokenActive,
      machine,
      machineState,
      requestTransition = () => {},
      requestArchive = () => {},
      requestUnarchive = () => {},
      requestRemoveArchivedValue = () => {},
      requestRewind = () => {},
      readOnly,
      blank,
      focused,
      multivalueDelimiter = COMMA,
      multivaluePasteDelimiter = ',',
      requestFocus = () => {},
      requestBlur = () => {},
      requestCancel = () => {},
      validityChanged = () => {}
    } = props;
    if (editing !== this.state.editing) {
      this.setState({
        editing: editing
      });
    }
    if (tokenActive !== this.state.tokenActive) {
      this.setState({
        tokenActive: tokenActive
      });
    }
    if (machine !== this.state.machine) {
      this.cleanupListeners();
      this.setState({
        machine: machine
      });
      this.connectListeners();
    }
    if (machineState !== this.state.machineState) {
      this.cleanupListeners();
      this.setState({
        machineState: machineState
      });
      this.connectListeners();
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
    if (requestArchive !== this.state.requestArchive) {
      this.setState({
        requestArchive: requestArchive
      });
    }
    if (requestUnarchive !== this.state.requestUnarchive) {
      this.setState({
        requestUnarchive: requestUnarchive
      });
    }
    if (requestRemoveArchivedValue !== this.state.requestRemoveArchivedValue) {
      this.setState({
        requestRemoveArchivedValue: requestRemoveArchivedValue
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
    if (multivalueDelimiter !== this.state.multivalueDelimiter) {
      this.setState({
        multivalueDelimiter: multivalueDelimiter
      });
    }
    if (multivaluePasteDelimiter !== this.state.multivaluePasteDelimiter) {
      this.setState({
        multivaluePasteDelimiter: multivaluePasteDelimiter
      });
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
    if (requestCancel !== this.state.requestCancel) {
      this.setState({
        requestCancel: requestCancel
      });
    }
    if (validityChanged !== this.state.validityChanged) {
      this.setState({
        validityChanged: validityChanged
      });
    }
  }

  @Bind
  /**
   * Called just before a component, such as this `Builder` or an `Assistant`, requests a transition.
   * This is useful, for example, when an `Assistant` wants to trigger a transition but needs its
   * associated `Builder` to commit a typed value to `state.unboxedValue` first.
   */
  beforeTransition () {
    // Override in subclass if necessary.
  }

  @Bind
  onTransition () {
    const oldValidity = this.state.valid;
    this.setState({valid: true, errorMsg: undefined});
    if (this.state.valid !== oldValidity) {
      this.state.validityChanged(this.state.valid, oldValidity);
    }
  }

  @Bind
  onTransitionFailed (reason) {
    if (this.state.machineState === this.state.machine.state) {
      const oldValidity = this.state.valid;
      this.setState({valid: false, errorMsg: reason.message});
      if (this.state.valid !== oldValidity) {
        this.state.validityChanged(this.state.valid, oldValidity);
      }
    }
  }

  @Bind
  /**
   * Call from a subclass to request the state machine for the containing token to attempt transition.
   * @param {object} options - Options for transition
   * @param {boolean} options.nextToken - If true, and this transition ends a token, this will trigger the start of a new one.
   */
  requestTransition (options) {
    return this.state.requestTransition(options);
  }

  @Bind
  /**
   * Call from a subclass to request the state machine for the containing token to attempt archive a value.
   */
  requestArchive () {
    return this.state.requestArchive();
  }

  @Bind
  /**
   * Call from a subclass to request the state machine for the containing token to attempt unarchiving a value.
   */
  requestUnarchive () {
    return this.state.requestUnarchive();
  }

  @Bind
  /**
   * Call from a subclass to request the state machine for the containing token to attempt removal of a specific value from the archive.
   */
  requestRemoveArchivedValue (idx) {
    return this.state.requestRemoveArchivedValue(idx);
  }

  @Bind
  /**
   * Call from a subclass to request the state machine for the containing token to attempt rewind.
   */
  requestRewind () {
    return this.state.requestRewind();
  }

  @Bind
  /**
   * Call from a subclass to request the state machine for the containing token to attempt rewind to
   * this builder
   */
  requestRewindTo (e) {
    if (!this.state.tokenActive) return;
    if (e !== undefined) {
      e.preventDefault();
      e.stopPropagation();
    }
    return this.state.requestRewind(this.state.machineState);
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

  @Bind
  /**
   * Call from a subclass to inform containing components that this component has received focus.
   * Since "focus" is not necessarily a literal concept (and could be triggered by a button press, or some
   * other interaction), this is an artificial bubbling mechanism.
   */
  requestFocus () {
    this.state.requestFocus();
  }

  @Bind
  /**
   * Call from a subclass to inform containing components that this `Builder` is cancelling
   * input.
   */
  requestCancel () {
    this.state.requestCancel();
  }

  @Bind
  /**
   * Call from a subclass to inform containing components that this component has been blurred.
   * Since "focus" is not necessarily a literal concept (and could be triggered by a button press, or some
   * other interaction), this is an artificial bubbling mechanism.
   *
   * @param {Event} e - A blur event from some DOM element within this Builder's visual representation.
   */
  requestBlur (e) {
    const assistantBox = document.getElementById('lex-assistant-box');
    if (!e.relatedTarget || assistantBox === null || !assistantBox.contains(e.relatedTarget)) {
      this.state.requestBlur();
    }
  }

  /*!
   * @private
   */
  renderReadOnly (props, state) {
    return (
      <span className={`token-input ${state.valid ? '' : 'invalid'} ${state.machineState.vkeyClass}`} onMouseDown={this.requestRewindTo}>
        {this.unboxedValue}
      </span>
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
   * @returns {TokenStateMachine} The containing `TokenStateMachine`.
   */
  get machine () {
    return this.state.machine;
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

  /**
   * Getter for `archive`d values.
   *
   * @returns {any[]} The archive of valid values for the underlying `State`.
   */
  get archive () {
    return this.state.machineState.archive;
  }

  /**
   * Getter for `archive`d values. Alias for `this.archive`.
   *
   * @returns {any[]} The archive of valid values for the underlying `State`.
   */
  get boxedArchive () {
    return this.state.machineState.boxedArchive;
  }

  /**
   * Getter for `unboxedArchive`.
   *
   * @returns {string[]} The archive of valid unboxed values for the underlying `State`.
   */
  get unboxedArchive () {
    return this.state.machineState.unboxedArchive;
  }
}
