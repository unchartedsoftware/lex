import StateTemplate from '../../state';

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
/**
 * Select an option from a list of options, such as
 * choosing "is", "is like", or "contains"
 */
export default class OptionSelection extends StateTemplate {
  /**
   * @param {State|undefined} parent - The parent state. Undefined if this is a root.
   * @param {string} name - A useful label for this state.
   * @param {Array[Option]} options - The list of options to select from.
   */
  constructor (parent, name, options) {
    super(parent, name, options[0]);
    _options.set(this, options);
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
   *
   * @param {Option} thisVal - The currently selected option.
   */
  validationFunction (thisVal) {
    return this.options.filter(o => o.key === thisVal.key).length === 1;
  }
}
