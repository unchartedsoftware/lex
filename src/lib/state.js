import EventEmitter from 'wolfy87-eventemitter';
import { ValueArchiveError } from './errors';

// StateTemplate private members
const _klass = new WeakMap();
const _config = new WeakMap();
// State private members
const _initialized = new WeakMap();
const _parent = new WeakMap();
const _name = new WeakMap();
const _vkey = new WeakMap();
const _validate = new WeakMap();
const _transitionFunction = new WeakMap();
const _readOnly = new WeakMap();
const _bindOnly = new WeakMap();
const _defaultValue = new WeakMap();
const _previewValue = new WeakMap();
const _multivalue = new WeakMap();
const _multivalueLimit = new WeakMap();
const _children = new WeakMap();
const _value = new WeakMap();
const _archive = new WeakMap();
const _icon = new WeakMap();

/**
 * A factory for a `State`, which can be used to produce instances
 * from the provided configuration object.
 *
 * Also a builder for chaining this `StateTemplate` to children, creating a
 * DAG of `StateTemplate`s which describes your search language.
 *
 * @param {Class} klass - A `State` class that this factory will produce.
 * @param {object} config - Options which will be applied to `State` `klass` upon instantiation
 *
 */
export class StateTemplate {
  constructor (klass, config = {}) {
    _klass.set(this, klass);
    _config.set(this, config);
    _children.set(this, []);
  }

  get parent () {
    return _parent.get(this);
  }

  get children () {
    return _children.get(this);
  }

  get root () {
    if (this.parent === undefined) {
      return this;
    } else {
      return this.parent.root;
    }
  }

  /**
   * Recursively clones this `StateTemplate` DAG, to retrieve an identical DAG of `State`s,
   * populated with their `defaultValue`s and ready to be traversed.
   *
   * @param {State} parent - A reference to the concrete parent `State`. Do not set when calling - used internally for recursion.
   * @returns {State} A clone of the DAG rooted at this `StateTemplate`, with each node instanced as a `State`.
   */
  getInstance (parent = undefined) {
    const StateKlass = _klass.get(this);
    const config = Object.assign({}, _config.get(this));
    config.parent = parent;
    const instance = new StateKlass(config);
    const childInstances = _children.get(this).map(c => c.getInstance(instance));
    _children.set(instance, childInstances);
    return instance;
  }

  /**
   * Add a child to this `StateTemplate`.
   *
   * @param {string} vkey - The (optional) unique key used to store this state's value within a `Token` output object. If not supplied, this state won't be represented in the `Token` value.
   * @param {State} StateKlass - The `State` type of the child state - must be a class which extends `State`.
   * @param {Object} config - Construction parameters for the child `State` class.
   * @returns {StateTemplate} A reference to the new child `State`, for chaining purposes.
   */
  to (vkey, StateKlass, config = {}) {
    // vkey is optional, so we have to jump through some hoops
    let Klass = StateKlass;
    let confObj = config;
    if (typeof vkey === 'string') {
      confObj.vkey = vkey;
    } else {
      Klass = vkey;
      confObj = StateKlass;
    }
    // now that we've hooped, actually build things.
    const child = new StateTemplate(Klass, confObj);
    _parent.set(child, this);
    _children.get(this).push(child);
    return child;
  }

  /**
   * Set the children of this `StateTemplate` to the provided branches.
   *
   * @param {...StateTemplate} branches - The new child `StateTemplate`s for this `StateTemplate`.
   * @returns {StateTemplate} A reference to this `StateTemplate` (not any of the child factories).
   */
  branch (...branches) {
    const roots = branches.map(t => t.root);
    _children.set(this, roots);
    return this;
  }
}

/**
 * Describes a particular state in a state machine (DAG) which
 * represents the interactive build process for a token. The state
 * machine implied by a tree of `State`s will be traversed
 * one state at a time (parent to child) by the user as they interact
 * with its visual representation, resulting in a sequence of state
 * values which constitute a valid "token" within your search language.
 *
 * This class is meant to be extended to implement new state types.
 *
 * `State` supports a notion of boxed/unboxed values, where the
 * internal representation of the value is richer than the `String` version
 * supplied by the user. Override `boxValue` and `unboxValue` to utilize
 * this functionality. By default, the internal representation and the
 * user-supplied one are the same (a `string`), and no overriding is necessary.
 *
 * Values should not be `Array`s, but can be `object`s (`Array`s interfere
 * with internal multi-value handling).
 *
 * `this.value` always accepts/returns a boxed value. Where desired, the boxed and
 * unboxed versions of the value can be identical.
 *
 * `State`s support an archive for values, in order to facilitate multi-
 * value entry. Valid values may be pushed onto the archive, making room
 * for a new value entry to take place. The top archived value may also
 * be moved back to replace the current value.
 *
 * This class is an `EventEmitter`, exposing the following events:
 * - `on('value changed', (newVal, oldVal) => {})` when the internal value changes.
 * - `on('value archived', () => {})` when a value is archived.
 * - `on('value unarchived', () => {})` when a value is archived.
 * - `on('preview value changed', (newVal, oldVal) => {})` when the internal preview value changes.
 * - `on('unboxed value change attempted', (newUnboxedVal, oldUnboxedVal))` when a user attempts to change the unboxed value. If it cannot be boxed, it may not trigger `value changed`.
 *
 * @param {object} config - Options for `State` `klass`.
 * @param {State | undefined} config.parent - The parent state. `undefined` if this is a root.
 * @param {string} config.name - A useful label for this state - used for display purposes.
 * @param {string} config.vkey - A key used to enter the value of this state into the value object of the containing machine.
 * @param {Function | undefined} config.transition - A function which returns true if this state is the next child to transition to, given the value of its parent. Undefined if this is root.
 * @param {Function | undefined} config.validation - A function which returns true iff this state has a valid value. Should throw an exception otherwise.
 * @param {any} config.defaultValue - The default boxed value for this state before it has been touched. Can be undefined. Should not be an `Array` (but can be an `object`).
 * @param {boolean} config.readOnly - This state is read only (for display purposes only) and should be skipped by the state machine. False by default.
 * @param {boolean} config.bindOnly - This state is bind only (can be created programatically, but not by a user). False by default.
 * @param {boolean} config.multivalue - Whether or not this state supports multi-value entry.
 * @param {number | undefined} config.multivalueLimit - An optional limit on the number of values this state can contain.
 * @param {string | Function} config.icon - A function which produces an icon suggestion (HTML `string`) for the containing `Token`, given the value of this state. May also supply an HTML `string` to suggest regardless of state value. The suggestion closest to the current valid state is used.
 * @example
 * class MyCustomState extends State {
 *   constructor (config) {
 *     super(config);
 *     const {myCustomOption} = config;
 *     // do something with myCustomOption
 *   }
 *
 *   boxValue (userVal) {
 *     // userVal is what a user might type to supply a value to this state
 *     // TODO implement transform into richer internal representation
 *   }
 *
 *   unboxValue (internalRepresentation) {
 *     // TODO return a string representation of the richer internal representation.
 *   }
 * }
 */
export class State extends EventEmitter {
  constructor (config) {
    const {parent, name, vkey, transition, validate, defaultValue, readOnly, bindOnly, multivalue, multivalueLimit, icon} = config;
    super();
    _parent.set(this, parent);
    _name.set(this, name);
    _vkey.set(this, vkey);
    _transitionFunction.set(this, transition !== undefined ? transition : () => true);
    _validate.set(this, validate !== undefined ? validate : () => true);
    _defaultValue.set(this, defaultValue !== undefined ? defaultValue : null);
    _multivalue.set(this, multivalue !== undefined ? multivalue : false);
    _multivalueLimit.set(this, multivalueLimit);
    _readOnly.set(this, readOnly !== undefined ? readOnly : false);
    _bindOnly.set(this, bindOnly !== undefined ? bindOnly : false);
    _children.set(this, []);
    _icon.set(this, icon);
    _value.set(this, _defaultValue.get(this));
    _previewValue.set(this, null);
    _archive.set(this, []);
  }

  get isReadOnly () {
    return _readOnly.get(this);
  }

  get isBindOnly () {
    return _bindOnly.get(this);
  }

  get parent () {
    return _parent.get(this);
  }

  get root () {
    if (this.parent === undefined) {
      return this;
    } else {
      return this.parent.root;
    }
  }

  get name () {
    return _name.get(this);
  }

  get vkey () {
    return _vkey.get(this);
  }

  get vkeyClass () {
    return typeof this.vkey === 'string' ? `token-vkey-${this.vkey.toLowerCase().replace(/\s/g, '-')}` : '';
  }

  get defaultValue () {
    return _defaultValue.get(this);
  }

  get children () {
    return _children.get(this);
  }

  get isMultivalue () {
    return _multivalue.get(this);
  }

  get multivalueLimit () {
    return _multivalueLimit.get(this);
  }

  get isRoot () {
    return this.parent === undefined;
  }

  get isTerminal () {
    return this.children.length === 0;
  }

  get initialized () {
    return _initialized.get(this) || true;
  }

  /*
   * @private
   */
  async doInitialize (context = [], initialValue) {
    const result = await this.initialize(context, initialValue);
    _initialized.set(this, true);
    return result;
  }

  /**
   * Perform any asynchronous operations required to initialize this `State`.
   * Override in subclasses to add asynchronous functionality to a `State`.
   *
   * @param {any[]} context - The current boxed value of the containing `TokenStateMachine` (all `State`s up to and including this one).
   * @param {any | undefined} initialUnboxedValue - The initial unboxed value which will be bound to this `State`.
   * @returns {Promise} A `Promise` which resolves when initialize completes successfully, rejecting otherwise.
   */
  async initialize (context = [], initialUnboxedValue) { // eslint-disable-line no-unused-vars
    // override
  }

  /*
   * @private
   */
  reset () {
    _initialized.delete(this);
    this.value = this.defaultValue;
    this.previewValue = undefined;
    _archive.set(this, []);
  }

  /**
   * Transform a user-supplied value into an internal representation. A no-op by default.
   *
   * @param {string} userVal - The user-supplied value.
   * @returns {string} A reference to userVal (no-op).
   */
  boxValue (userVal) {
    return userVal;
  }

  /**
   * Transforms an internal representation of a value into a user-supplied-style value. A no-op by default.
   *
   * @param {any} internalRepresentation - An internal representation of a value.
   * @returns {string} - The user-supplied-style value.
   */
  unboxValue (internalRepresentation) {
    return internalRepresentation;
  }

  /*
   * @private
   * @param {any} value - The internal representation of the value.
   * @returns {string | undefined} - The user-supplied-style value.
   */
  suggestIcon () {
    const iconFn = _icon.get(this);
    if (iconFn === undefined || typeof iconFn === 'string') {
      return iconFn;
    } else {
      return iconFn(this.value);
    }
  }

  get isDefault () { return this.value === this.defaultValue; }

  /**
   * Utilizes the `validate` function to check value validity.
   *
   * @returns {boolean} Returns `true` if this state is valid. Should throw an exception with information about validation error otherwise.
   */
  get isValid () {
    let isValid = false;
    try {
      isValid = _validate.get(this)(this.value, this.archive);
    } catch (err) {
      let message = 'Error thrown during validation';
      if (this.name) {
        message += ` of state named: ${this.name}`;
      }
      console.error(message, err); // eslint-disable-line no-console
      throw (err);
    }
    return isValid;
  }

  /**
   * Called from a parent `State`, this method utilizes the transition function
   * to determine whether or not a transition to this `State` is valid given the parent's value.
   *
   * @param {boolean} ignoreBindOnly - All bind-only states are illegal transitions unless `ignoreBindOnly` is true.
   * @returns {boolean} Returns `true` iff a transition to this child is possible given the parent's value (and whether or not this `State` is `bindOnly`).
   */
  isValidTransition (ignoreBindOnly = false) {
    if (this.parent === undefined) {
      return !ignoreBindOnly || this.isBindOnly;
    } else if (ignoreBindOnly || !this.isBindOnly) {
      return _transitionFunction.get(this)(this.parent.value);
    } else {
      return false;
    }
  }

  /**
   * Getter for `value`.
   *
   * @returns {any} The current (boxed) value from this `State`.
   */
  get value () {
    return _value.get(this);
  }

  /**
   * Setter for `value`. Clears any previewValue (if present).
   *
   * @param {any} newVal - Set a new (boxed) value for this `State`.
   */
  set value (newVal) {
    if (newVal !== this.value) {
      const oldVal = this.value;
      const oldUnboxedVal = this.unboxedValue;
      _value.set(this, newVal);
      this.emit('value changed', newVal, oldVal, this.unboxedValue, oldUnboxedVal);
    }
  }

  /**
   * Getter for `value`. Alias for `this.value`.
   *
   * @returns {any} The current (boxed) value from this `State`.
   */
  get boxedValue () {
    return this.value;
  }

  /**
   * Setter for `value`. Alias for  `this.value`. Clears any previewValue (if present).
   *
   * @param {any} newBoxedVal - Set a new (boxed) value for this `State`. Alias for this.value setter.
   */
  set boxedValue (newBoxedVal) {
    this.value = newBoxedVal;
  }

  /**
   * Getter for `unboxedValue`.
   *
   * @returns {any} The current (unboxed) value from this `State`.
   */
  get unboxedValue () {
    return this.unboxValue(this.value);
  }

  /**
   * Setter for `unboxedValue`. Clears any previewValue (if present).
   *
   * @param {any} newUnboxedVal - Set a new (unboxed) value for this `State`.
   */
  set unboxedValue (newUnboxedVal) {
    this.emit('unboxed value change attempted', newUnboxedVal, this.unboxedValue);
    this.value = this.boxValue(newUnboxedVal);
  }

  /**
   * Getter for `previewValue` - A value which is previewed as a suggestion for the user, without overwriting the value they've entered.
   *
   * @returns {any} The current (boxed) previewValue from this `State`.
   */
  get previewValue () {
    return _previewValue.get(this);
  }

  /**
   * Getter for `boxedPreviewValue`. Alias for `this.previewValue`.
   *
   * @returns {any} The current (boxed) previewValue from this `State`.
   */
  get boxedPreviewValue () {
    return this.previewValue;
  }

  /**
   * Getter for `unboxedPreviewValue` - A value which is previewed as a suggestion for the user, without overwriting the value they've entered. Unboxed version.
   *
   * @returns {string} The current (boxed) previewValue from this `State`.
   */
  get unboxedPreviewValue () {
    return this.unboxValue(this.previewValue);
  }

  /**
   * Setter for `previewValue` - A value which is previewed as a suggestion for the user, without overwriting the value they've entered.
   *
   * @param {any} boxedValue - The new (boxed) previewValue for this `State`.
   */
  set previewValue (boxedValue) {
    const oldPreviewVal = this.previewValue;
    const oldUnboxedPreviewVal = this.unboxedPreviewValue;
    _previewValue.set(this, boxedValue);
    this.emit('preview value changed', boxedValue, oldPreviewVal, this.unboxedPreviewValue, oldUnboxedPreviewVal);
  }

  /**
   * Setter for `boxedPreviewValue`. Alias for `this.previewValue`.
   *
   * @param {any} boxedValue - The new (boxed) previewValue for this `State`.
   */
  set boxedPreviewValue (boxedValue) {
    this.previewValue = boxedValue;
  }

  /**
   * Setter for `previewValue` - A value which is previewed as a suggestion for the user, without overwriting the value they've entered. Unboxed version.
   *
   * @param {string} unboxedValue - The new (unboxed) previewValue for this `State`.
   */
  set unboxedPreviewValue (unboxedValue) {
    this.previewValue = this.boxValue(unboxedValue);
  }

  /**
   * Getter for `archive`d values.
   *
   * @returns {any[]} The archive of valid values for this `State`.
   */
  get archive () {
    return _archive.get(this);
  }

  /**
   * Getter for `archive`d values. Alias for `this.archive`.
   *
   * @returns {any[]} The archive of valid values for this `State`.
   */
  get boxedArchive () {
    return this.archive;
  }

  /**
   * Getter for `unboxedArchive`.
   *
   * @returns {string[]} The archive of valid unboxed values for this `State`.
   */
  get unboxedArchive () {
    return this.archive.map(a => this.unboxValue(a));
  }

  /**
   * @returns {boolean} Returns true if the archive has room left, false otherwise. Does not validate.
   */
  get canArchiveValue () {
    return this.isMultivalue && (this.multivalueLimit === undefined || this.archive.length < this.multivalueLimit);
  }

  /**
   * Moves the current value to the archive, and resets the current value.
   *
   * @param {Object} context - The current boxed value of the containing `TokenStateMachine` (all `State`s up to and including this one).
   */
  archiveValue (context) { // eslint-disable-line no-unused-vars
    if (!this.isValid) {
      throw new ValueArchiveError(`Cannot archive invalid value for current state: ${this.value}`);
    } else if (this.multivalueLimit && this.archive.length === this.multivalueLimit) {
      throw new ValueArchiveError(`Multivalue size limit reached for state ${this.name}`);
    }
    const oldVal = this.value;
    const oldUnboxedVal = this.unboxedValue;
    this.archive.push(this.value);
    this.value = this.defaultValue;
    this.previewValue = null;
    this.emit('value changed', this.value, oldVal, this.unboxedValue, oldUnboxedVal);
    this.emit('value archived');
  }

  /**
   * Moves the top value from the archive back to the current value, overwriting it.
   *
   * @param {Object} context - The current boxed value of the containing `TokenStateMachine` (all `State`s up to and including this one).
   */
  unarchiveValue (context) { // eslint-disable-line no-unused-vars
    if (this.archive.length === 0) {
      throw new ValueArchiveError('Cannot unarchive from an empty archive');
    }
    const oldVal = this.value;
    const oldUnboxedVal = this.unboxedValue;
    this.value = this.archive.pop();
    this.emit('value changed', this.value, oldVal, this.unboxedValue, oldUnboxedVal);
    this.emit('value unarchived');
  }

  /**
   * Remove a specific value from the archive, by index.
   *
   * @param {number} idx - The index of the archived value to remove.
   * @param {Object} context - The current boxed value of the containing `TokenStateMachine` (all `State`s up to and including this one).
   */
  removeArchivedValue (idx, context) { // eslint-disable-line no-unused-vars
    if (this.archive.length <= idx) {
      throw new ValueArchiveError(`Cannot remove value ${idx} from archive with length ${this.state.archive.length}`);
    }
    this.archive.splice(idx, 1);
    this.emit('value changed', this.value, this.value, this.unboxedValue, this.unboxedValue);
    this.emit('value unarchived');
  }

  /**
   * Remove all values from the archive.
   */
  removeArchivedValues () {
    this.archive.splice(0, this.archive.length);
    this.emit('value changed', this.value, this.value, this.unboxedValue, this.unboxedValue);
    this.emit('value unarchived'); // TODO should probably implement an 'archive changed' event at some point, but this will work for now.
  }
}
