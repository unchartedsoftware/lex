import { h } from 'preact';
import { Builder } from './builder';
import { Bind } from 'lodash-decorators';
import { propsToState } from '../lib/util';

/**
 * Richer interaction areas for building values.
 *
 * These have no read-only mode, and are utilized as "drop-downs"
 * to provide additional interactivity and visualization as users.
 *
 * Subclasses generally implement `delegateEvent`, `renderInteractive` and `focus`.
 *
 * @example
 * // See OptionAssistant for an example implementation.
 */
export class Assistant extends Builder {
  /**
   * If overridden, must be called via `super.processProps(props)`.
   *
   * @param {Object} props - Incoming properties.
   */
  processProps (props) {
    propsToState(this, props, [
      {
        k: 'machineState',
        before: () => {
          this.cleanupListeners();
          this.beforeChangeMachineState();
        },
        after: () => {
          this.connectListeners();
          this.afterChangeMachineState();
        }
      }
    ]);
    super.processProps(props);
  }

  /**
   * Called just before the machineState prop changes.
   */
  beforeChangeMachineState () {
  }

  /**
   * Called just after the machineState prop changes.
   */
  afterChangeMachineState () {
  }

  /*!
   * @private
   */
  renderReadOnly (props, state) { // eslint-disable-line no-unused-vars
    // do nothing
  }

  /*!
   * @private
   */
  renderInteractive (props, state) {
    const menu = this.renderAssistantMenu(props, state);
    const body = this.renderAssistantBody(props, state);
    const instructions = this.renderAssistantInstructions(props, state);
    return (
      <div className='assistant'>
        <div className='assistant-header'>
          {instructions}
          <span className='pull-right assistant-menu'>
            {menu}
          </span>
        </div>
        {body}
      </div>
    );
  }

  /**
   * Render the interactive instructions for this `Assistant`. Will appear at the top-left of the `Assistant` in its navigation bar.
   * Can override in subclasses.
   *
   * @param {Object} props - Properties.
   * @param {Object} state - Component state (`this.state`).
   * @param {boolean} state.valid - True iff the value of the underlying `State` is valid.
   * @param {boolean} state.readOnly - True iff this `Builder` is in read-only mode (generally speaking, if the user has progressed past this `State` to a later one).
   * @param {State} state.machineState - The underlying `State`.
   * @returns {string} The instructions string.
   */
  renderAssistantInstructions (props, state) { // eslint-disable-line no-unused-vars
    return this.machineState.name;
  }

  @Bind
  clickRewind () {
    this.requestRewind();
  }

  @Bind
  clickCancel () {
    this.requestCancel();
  }

  @Bind
  clickTransition () {
    this.requestTransition();
  }

  /**
   * Render the interactive menu of this `Assistant`. Will appear at the top-right of the `Assistant` in its navigation bar.
   * Can override in subclasses.
   *
   * @param {Object} props - Properties.
   * @param {Object} state - Component state (`this.state`).
   * @param {boolean} state.valid - True iff the value of the underlying `State` is valid.
   * @param {boolean} state.readOnly - True iff this `Builder` is in read-only mode (generally speaking, if the user has progressed past this `State` to a later one).
   * @param {State} state.machineState - The underlying `State`.
   * @returns {VNode} The menu content.
   */
  renderAssistantMenu (props, state) { // eslint-disable-line no-unused-vars
    return (
      <span className='btn-group'>
        <button className='btn btn-xs btn-default' onClick={this.clickRewind} disabled={this.state.machine.state === this.state.machine.rootState}>&lt;&nbsp;Back</button>
        <button className='btn btn-xs btn-default' onClick={this.clickCancel}>{this.state.editing ? 'Discard Changes' : 'Cancel'}</button>
        <button className='btn btn-xs btn-default' onClick={this.clickTransition}>{this.state.machine.state.isTerminal ? 'Finish' : 'Next'}&nbsp;&gt;</button>
      </span>
    );
  }

  /**
   * Render the interactive content of this `Assistant`.
   * Must override in subclasses.
   *
   * @param {Object} props - Properties.
   * @param {Object} state - Component state (`this.state`).
   * @param {boolean} state.valid - True iff the value of the underlying `State` is valid.
   * @param {boolean} state.readOnly - True iff this `Builder` is in read-only mode (generally speaking, if the user has progressed past this `State` to a later one).
   * @param {State} state.machineState - The underlying `State`.
   * @returns {VNode} The body content.
   */
  renderAssistantBody (props, state) { // eslint-disable-line no-unused-vars
    // do nothing
  }
}
