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
const _refreshOptions = new WeakMap();
const _allowUnknown = new WeakMap();
/**
 * Select an option from a list of options, such as
 * choosing "is", "is like", or "contains"
 */
export class OptionSelection extends StateTemplate {
  /**
   * @param {Object} config - A configuration object.
   *   @property {Array[Option] | AsyncFunction} options - The list of options to select from, or an async function that generates them.
   *   @property {boolean} allowUnknown - Allow user to enter unknown options by entering custom values.
   *   @property See StateTemplate for other properties.
   */
  constructor (config) {
    if (config.validationFunction === undefined) {
      config.validationFunction = (thisVal) => {
        if (thisVal === null || thisVal === undefined) return false;
        return this.options.filter(o => o.key === thisVal.key).length === 1;
      };
    }
    if (config.transitionFunction === undefined) config.transitionFunction = () => true;
    if (config.options === undefined) config.options = [];
    if (config.allowUnknown === undefined) config.allowUnknown = false;
    super(config);
    if (Array.isArray(config.options)) {
      _options.set(this, config.options);
    } else {
      _options.set(this, []);
      _refreshOptions.set(this, async () => {
        this.options = await config.options();
      });
      this.refreshOptions();
    }
    _allowUnknown.set(this, config.allowUnknown);
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

  refreshOptions () {
    if (_refreshOptions.has(this)) {
      _refreshOptions.get(this)();
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
}
