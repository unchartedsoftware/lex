import { StateTemplate } from '../../state';

const _key = new WeakMap();
const _meta = new WeakMap();
/**
 * An option within a list of options
 */
export class Option {
  /**
   * @param {string} key - A label for this option. Should be unique within the list of options.
   * @param {any} meta - Whatever you want.
   */
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
const _allowUnknown = new WeakMap();
/**
 * Select an option from a list of options, such as
 * choosing "is", "is like", or "contains"
 */
export class ValueEntry extends StateTemplate {
  /**
   * @param {State|undefined} parent - The parent state. Undefined if this is a root.
   * @param {Function} transitionFunction - A function which returns true if this state is the next child to transition to, given the value of its parent. Undefined if this is root.
   * @param {string} name - A useful label for this state.
   * @param {Array[Option]} options - The list of options to select from.
   * @param {boolean} allowUnknown - Allow user to enter unknown options by entering custom values.
   */
  constructor (parent, transitionFunction, name, options, allowUnknown = false) {
    super(parent, transitionFunction, name, null);
    _options.set(this, options);
    _allowUnknown.set(this, allowUnknown);
  }

  /**
   * @returns {Array[Option]} - The list of options to select from.
   */
  get options () {
    return _options.get(this);
  }

  /**
   * @param {Array[Option]} newOptions - A new set of options for this selector.
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
   * @returns {Option} An Option instance.
   */
  boxValue (key) {
    const matches = this.options.filter(o => o.key.toLowerCase() === key.toLowerCase());
    if (matches.length > 0) {
      return matches[0];
    } else if (this.allowUnknown) {
      return new Option(key, {});
    } else {
      return null;
    }
  }

  /**
   * Transforms an internal representation of a value into a user-supplied-style value.
   *
   * @param {Option} option - An `Option instance.
   * @returns {string} - The string value of the `Option`'s key.
   */
  unboxValue (option) {
    if (option === undefined || option === null) return null;
    return option.key;
  }

  /**
   *
   * @param {Option} thisVal - The currently selected option.
   */
  validationFunction (thisVal) {
    if (thisVal === null || thisVal === undefined) return false;
    return this.options.filter(o => o.key === thisVal.key).length === 1;
  }
}
