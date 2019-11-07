import EventEmitter from 'wolfy87-eventemitter';

// ActionTemplate private members
const _config = new WeakMap();
const _klass = new WeakMap();
// Action private members
const _initialized = new WeakMap();
const _name = new WeakMap();
const _vkey = new WeakMap();
const _defaultValue = new WeakMap();
const _value = new WeakMap();

/**
 * A factory for an `Action`, which can be used to produce instances
 * from the provided configuration object.
 *
 * @param {Class} klass - An `Action` class that this factory will produce.
 * @param {object} config - Options which will be applied to `Action` `klass` upon instantiation.
 *
 */
export class ActionTemplate {
  constructor (klass, config = {}) {
    _klass.set(this, klass);
    _config.set(this, config);
  }
  /**
   * Instantiates this `Action`.
   *
   * @returns {Action} An instantiated `Action`.
   */
  getInstance () {
    const ActionKlass = _klass.get(this);
    const config = Object.assign({}, _config.get(this));
    return new ActionKlass(config);
  }
}

/**
 * A concrete `Action`, presented as a button only on completed `Token`s,
 * which allows users to interact with `Token`s in some way. Each `Action`
 * has its own internal value, and can only affect its own internal value.
 *
 * @param {object} config - Options for `Action` class.
 * @param {string} config.name - A name for this `Action`, used by default for display purposes.
 * @param {string} config.vkey - A key used to uniquely identify the value of this `Action` when returned alongside others from the same `Token`.
 * @param {object} config.defaultValue - The default internal value for this `Action`.
 */
export class Action extends EventEmitter {
  constructor (config) {
    const {name, vkey, defaultValue} = config;
    super();
    this._id = Math.random();
    _name.set(this, name);
    _vkey.set(this, vkey);
    _defaultValue.set(this, defaultValue !== undefined ? defaultValue : {});
    _value.set(this, _defaultValue.get(this));
  }

  get id () {
    return this._id;
  }

  get name () {
    return _name.get(this);
  }

  get vkey () {
    return _vkey.get(this);
  }

  get defaultValue () {
    return _defaultValue.get(this);
  }

  get initialized () {
    return _initialized.get(this) || true;
  }

  /**
   * Getter for `value`.
   *
   * @returns {any} The current internal  value from this `Action`.
   */
  get value () {
    return _value.get(this);
  }

  /**
   * Setter for `value`. Must be used when changing the internal value
   * in order to trigger associated events.
   *
   * @param {any} newVal - Set a new internal value for this `Action`.
   */
  set value (newVal) {
    if (newVal !== this.value) {
      const oldVal = this.value;
      _value.set(this, newVal);
      this.emit('value changed', newVal, oldVal);
    }
  }

  /*
   * @private
   */
  async doInitialize (context = []) {
    const result = await this.initialize(context);
    _initialized.set(this, true);
    return result;
  }

  /**
   * Perform any asynchronous operations required to initialize this `Action`.
   * Override in subclasses to add asynchronous functionality to a `Action`.
   *
   * @param {any[]} context - The current boxed value of the containing `TokenStateMachine` (all `State`s).
   * @returns {Promise} A `Promise` which resolves when initialize completes successfully, rejecting otherwise.
   */
  async initialize (context = []) { // eslint-disable-line no-unused-vars
    // override
  }

  /*
   * @private
   */
  reset () {
    _initialized.delete(this);
    this.value = this.defaultValue;
  }

  /**
   * Override this function to suggest CSS classes to the containing `Token`.
   * This function can use the current value of this `Action` to compute these
   * classes dynamically.
   *
   * @returns {string[]} A list of CSS classes to hint to the containing `Token`.
   */
  suggestCssClass () {

  }

  /*
   * @private
   * Called by associated `Component` whenever this `Action` is triggered.
   * Override to implement custom functionality.
   */
  onAction () {
    // TODO class changes should work because query changed should fire!
  }
}
