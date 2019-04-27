import { h } from 'preact';
import { Builder } from './builder';
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
      },
      {k: 'tokenXIcon', default: '&times'}
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

  /*
   * Get the configured DOM to represent 'X' icons
   */
  get xicon () {
    return <span dangerouslySetInnerHTML={{__html: this.state.tokenXIcon}} />;
  }

  /*!
   * @private
   */
  renderReadOnly (props, state) { // eslint-disable-line no-unused-vars
    // do nothing
  }

  /**
   * Children may set loading in order to visually indicate that the Assistant is performing an async operation.
   *
   * @param {boolean} isLoading - Whether or not this Assistant is performing an async operation.
   */
  set loading (isLoading) {
    this.setState({loading: isLoading});
  }

  /*!
   * @private
   */
  renderInteractive (props, state) {
    const body = this.renderAssistantBody(props, state);
    const spinner = state.loading ? (
      <div className='assistant-header-progress'>
        <div className='line' />
        <div className='subline inc' />
        <div className='subline dec' />
      </div>
    ) : '';
    if (body || state.loading) {
      return (
        <div className='assistant'>
          <div className='assistant-header'>{this.machineState.name}</div>
          {body}
          {spinner}
        </div>
      );
    }
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
