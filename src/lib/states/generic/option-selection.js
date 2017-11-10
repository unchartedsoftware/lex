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
   * @param {Function|undefined} transitionFunction - A function which returns true if this state is the next child to transition to, given the value of its parent. If not supplied, then transition will always be valid.
   */
  constructor (parent, name, options, transitionFunction = () => true) {
    super(parent, name, (val) => {
      return options.filter(o => o.key === val).length === 1;
    }, transitionFunction, options[0]);
    _options.set(this, options);
  }

  /**
   * @returns {Array[string]} - The list of options to select from.
   */
  get options () {
    return _options.get(this);
  }
}
