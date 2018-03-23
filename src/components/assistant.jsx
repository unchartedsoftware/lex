import { h } from 'preact';
import { Builder } from './builder';

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
        <button className='btn btn-xs btn-default' onMouseDown={this.requestRewind} disabled={this.state.machine.state === this.state.machine.rootState}>&lt;&nbsp;Back</button>
        <button className='btn btn-xs btn-default' onMouseDown={this.requestCancel}>Cancel</button>
        <button className='btn btn-xs btn-default' onMouseDown={this.requestTransition}>{this.state.machine.state.isTerminal ? 'Finish' : 'Next'}&nbsp;&gt;</button>
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

  /**
   * Receives `keydown` events from the associated `Builder`, proxied to this component so
   * that users can interact with this `Assistant` via keyboard controls without losing
   * focus on their `Builder`.
   *
   * @param {Event} e - The incoming event.
   * @returns {boolean} - Returns `true` iff the event was consumed by this `Assistant`.
   */
  delegateEvent (e) { // eslint-disable-line no-unused-vars
    // override in subclass - keyDown events coming from search-box. Return true if the event was consumed.
  }
}
