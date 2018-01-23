import { OptionState } from './option-state';

/**
 * A state representing the selection of one or more options from a list of options.
 * Intended to facilitate both simple cases (such as selecting from a list
 * of predefined options) and advanced ones (such as selecting from a list
 * of dynamically updating suggestions).
 *
 * By default, this state (and any extending classes) can be visually represented by `MultiOptionBuilder` and `MultiOptionAssistant`.
 *
 * This class is an `EventEmitter` and exposes the following events (in addition to `State`'s events):
 * - `on('options changed', (newOptions, oldOptions) => {})` when the internal list of options changes.
 *
 * @param {Object} config - A configuration object. Inherits all options from `StateTemplate`, and adds the following:
 * @param {Option[] | AsyncFunction} config.options - The list of options to select from, or an `async` function that generates them.
 * @param {boolean} config.allowUnknown - Allow user to enter unknown options by entering custom values.
 */
export class MultiOptionState extends OptionState {
  constructor (config) {
    if (config.validate === undefined) {
      config.validate = (thisVal) => {
        if (!Array.isArray(thisVal)) return false;
        return thisVal.filter(v => this.options.filter(o => o.key === v.key).length === 1).length === thisVal.length;
      };
    }
    super(config);
  }

  /**
   * Transform a user-supplied value into an internal representation.
   *
   * @param {string[]} keys - The user-supplied values.
   * @returns {OptionStateOption[]} An array of `OptionStateOption` instances.
   */
  boxValue (keys) {
    if (keys === null) { return keys; }
    return keys.map(k => super.boxValue(k));
  }

  /**
   * Transforms an internal representation of a value into a user-supplied-style value.
   *
   * @param {OptionStateOption[]} options - An array of `OptionStateOption` instances.
   * @returns {string[]} - The string values of the `OptionStateOption`s' keys.
   */
  unboxValue (options) {
    if (options === null) { return options; }
    return options.map(o => super.unboxValue(o));
  }
}
