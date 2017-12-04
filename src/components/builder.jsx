import { Component } from 'preact';
import { StateTransitionError } from '../lib/errors';

// TODO support drop-down-like "add-ons" and manage positioning here.
export class Builder extends Component {
  constructor () {
    super(arguments);
    this.state = {
      valid: true
    };
  }

  processProps (props) {
    const { machineState, onTransition } = props;
    if (onTransition !== this.state.onTransition) {
      this.setState({
        onTransition: onTransition
      });
    }
    if (machineState !== this.state.machineState) {
      this.setState({
        machineState: machineState
      });
    }
  }

  componentWillMount () {
    this.processProps(this.props);
  }

  componentWillReceiveProps (nextProps) {
    this.processProps(nextProps);
  }

  transition () {
    try {
      this.setState({valid: true, errorMsg: undefined});
      this.state.onTransition();
    } catch (err) {
      if (err instanceof StateTransitionError) {
        this.setState({valid: false, errorMsg: err.message});
      } else {
        throw err;
      }
    }
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
}
