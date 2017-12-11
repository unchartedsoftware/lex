import { h, Builder } from './builder';

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
  renderReadOnly (props, state) {
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
  delegateEvent (e) {
    // override in subclass - keyDown events coming from search-box. Return true if the event was consumed.
  }
}
