import { h, Component } from 'preact';
import { propsToState } from '../../../lib/util';

/**
 * A visual representation of an Action
 */
export class ActionBuilder extends Component {
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
    this.processProps(nextProps);
  }

  /**
   * If overidden, must be called via `super.processProps(props)`.
   *
   * @param {Object} props - Incoming properties.
   */
  processProps (props) {
    propsToState(this, props, [
      {k: 'label', default: props.machineState.label},
      {k: 'onClick', default: props.machineState.onClick || this.onClick},
      {k: 'readOnly', default: false},
      {k: 'tokenActive', default: false},
      {k: 'machine'},
      {k: 'machineState'},
      {k: 'requestTransition', default: () => true},
      {k: 'requestArchive', default: () => true},
      {k: 'requestUnarchive', default: () => true},
      {k: 'requestRemoveArchivedValue', default: () => true},
      {k: 'requestRemoveArchivedValues', default: () => true},
      {k: 'requestRewind', default: () => true},
      {k: 'requestFocus', default: () => true},
      {k: 'requestBlur', default: () => true},
      {k: 'requestCancel', default: () => true}
    ]);
  }

  /**
   * Handle click events for this `ActionBuilder`
   * Must override in subclasses.
   */
  onClick () {
    throw new Error(`${this.constructor.name} must implement onClick()`);
  }

  /*!
   * @private
   */
  renderReadOnly () {
    return (
      <button disabled='disabled'>
        {this.state.label}
      </button>
    );
  }

  /**
   * Render the interactive version of this `ActionBuilder`. Usually some form of `<button>`.
   * Must override in subclasses.
   *
   * @param {Object} props - Properties.
   * @param {Object} state - Component state (`this.state`).
   * @param {boolean} state.valid - True if the value of the underlying `State` is valid.
   * @param {boolean} state.readOnly - True if this `ActionBuilder` is in read-only mode (generally speaking, if the user has progressed past this `State` to a later one).
   * @param {State} state.machineState - The underlying `State`.
   * @example
   * renderInteractive (props, {valid, readOnly}) {
   *  return (
   *    <button
   *       type="button"
   *       disabled={readOnly}
   *    />
   *   );
   * }
   */
  renderInteractive () {
    return (
      <button onClick={this.state.onClick}>
        {this.state.label}
      </button>
    );
  }

  /*!
   * @private
   */
  render (props, state) {
    const {readOnly, machineState} = state;
    return readOnly || machineState.isReadOnly ? this.renderReadOnly(props, state) : this.renderInteractive(props, state);
  }
}
