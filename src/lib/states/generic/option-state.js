import { StateTemplate } from '../../state';

const _key = new WeakMap();
const _meta = new WeakMap();

/**
 * An option within a list of options
 *
 * @param {string} key - A label for this option. Should be unique within the list of options.
 * @param {any} meta - Whatever you want.
 */
export class OptionStateOption {
  constructor (key, meta) {
    _key.set(this, key);
    _meta.set(this, meta);
  }

  /**
   * @returns {string} The label for this option.
   */
  get key () { return _key.get(this); }

  /**
   * @returns {any} The metadata associated with this option.
   */
  get meta () { return _meta.get(this); }
}

const _options = new WeakMap();
const _refreshOptions = new WeakMap();
const _allowUnknown = new WeakMap();

/**
 * A state representing the selection of an option from a list of options.
 * Intended to facilitate both simple cases (such as selecting from a list
 * of predefined options) and advanced ones (such as selecting from a list
 * of dynamically updating suggestions).
 *
 * By default, this state (and any extending classes) can be visually represented by `OptionBuilder` and `OptionAssistant`.
 *
 * This class is an `EventEmitter` and exposes the following events (in addition to `State`'s events):
 * - `on('options changed', (newOptions, oldOptions) => {})` when the internal list of options changes.
 *
 * @param {Object} config - A configuration object. Inherits all options from `StateTemplate`, and adds the following:
 * @param {Option[] | AsyncFunction} config.options - The list of options to select from, or an `async` function that generates them.
 * @param {boolean} config.allowUnknown - Allow user to enter unknown options by entering custom values.
 */
export class OptionState extends StateTemplate {
  constructor (config) {
    if (config.validationFunction === undefined) {
      config.validationFunction = (thisVal) => {
        if (thisVal === null || thisVal === undefined) return false;
        return this.options.filter(o => o.key === thisVal.key).length === 1;
      };
    }
    if (config.options === undefined) config.options = [];
    if (config.allowUnknown === undefined) config.allowUnknown = false;
    super(config);
    if (Array.isArray(config.options)) {
      _options.set(this, config.options);
    } else {
      _options.set(this, []);
      _refreshOptions.set(this, async (hint = '') => {
        try {
          this.options = await config.options(hint);
        } catch (err) {
          console.error('Could not refresh list of options.');
          throw err;
        }
      });
      this.refreshOptions();
    }
    _allowUnknown.set(this, config.allowUnknown);
  }

  /**
   * Getter for `options`.
   *
   * @returns {Array[Option]} - The list of options to select from.
   */
  get options () {
    return _options.get(this);
  }

  /**
   * Setter for `options`.
   *
   * @param {Option[]} newOptions - A new set of options for this selector.
   */
  set options (newOptions) {
    if (this.options !== newOptions) {
      const oldOptions = this.options;
      _options.set(this, newOptions);
      this.emit('options changed', newOptions, oldOptions);
    }
  }

  /**
   * @returns {boolean} - Whether or not this option selector allows the creation of unknown options.
   */
  get allowUnknown () {
    return _allowUnknown.get(this);
  }

  /**
   * Transform a user-supplied value into an internal representation.
   *
   * @param {string} key - The user-supplied value.
   * @returns {OptionStateOption} An Option instance.
   */
  boxValue (key) {
    const matches = this.options.filter(o => o.key.toLowerCase() === key.toLowerCase());
    if (matches.length > 0) {
      return matches[0];
    } else if (this.allowUnknown) {
      return new OptionStateOption(key, {});
    } else {
      return null;
    }
  }

  /**
   * Transforms an internal representation of a value into a user-supplied-style value.
   *
   * @param {OptionStateOption} option - An `OptionStateOption` instance.
   * @returns {string} - The string value of the `Option`'s key.
   */
  unboxValue (option) {
    if (option === undefined || option === null) return null;
    return option.key;
  }

  /**
   * Can be called by a child class to trigger a refresh of options based on a hint (what the
   * user has typed so far). Will trigger the `async` function supplied to the constructor as `config.options`.
   *
   * @param {string | undefined} hint - What the user has typed, if anything.
   * @returns {Promise} Resolves with the new list of options.
   */
  refreshOptions (hint = '') {
    if (_refreshOptions.has(this)) {
      _refreshOptions.get(this)(hint);
    }
  }
}
