import EventEmitter from 'wolfy87-eventemitter';

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
const _children = new WeakMap();
const _template = new WeakMap();
const _value = new WeakMap();
const _archive = new WeakMap();
const _icon = new WeakMap();

/**
 * Descibes a particular state in a state machine (DAG) which
 * represents the interactive build process for a token. The state
 * machine implied by a chain of `StateTemplate`s will be traversed
 * one state at a time (parent to child) by the user as they interact
 * with its visual representation, resulting in a sequence of state
 * values which constitute a valid "token" within your search language.
 *
 * This class is meant to be extended to implement new state types.
 *
 * `StateTemplate` supports a notion of boxed/unboxed values, where the
 * internal representation of the value is richer than the `String` version
 * supplied by the user. Override `boxValue` and `unboxValue` to utilize
 * this functionality. By default, the internal representation and the
 * user-supplied one are the same (a `string`), and no overriding is necessary.
 *
 * @param {object} config - Options for `StateTemplate`.
 * @param {State | undefined} config.parent - The parent state. `undefined` if this is a root.
 * @param {string} config.name - A useful label for this state - used for display purposes.
 * @param {string} config.vkey - A key used to enter the value of this state into the value object of the containing machine.
 * @param {Function | undefined} config.transition - A function which returns true if this state is the next child to transition to, given the value of its parent. Undefined if this is root.
 * @param {Function | undefined} config.validation - A function which returns true iff this state has a valid value. Should throw an exception otherwise.
 * @param {any} config.defaultValue - The default boxed value for this state before it has been touched. Can be undefined. Should not be an `Array` (but can be an `object`).
 * @param {boolean} config.readOnly - This state is read only (for display purposes only) and should be skipped by the state machine. False by default.
 * @param {boolean} config.bindOnly - This state is bind only (can be created programatically, but not by a user). False by default.
 * @param {boolean} config.multivalue - Whether or not this state supports multi-value entry.
 * @param {string | Function} config.icon - A function which produces an icon suggestion (HTML `string`) for the containing `Token`, given the value of this state. May also supply an HTML `string` to suggest regardless of state value. The suggestion closest to the current valid state is used.
 *
 * @example
 * class MyCustomState extends StateTemplate {
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
export class StateTemplate extends EventEmitter {
  constructor (config) {
    const {parent, name, vkey, transition, validate, defaultValue, readOnly, bindOnly, multivalue, icon} = config;
    super();
    _parent.set(this, parent);
    _name.set(this, name);
    _vkey.set(this, vkey);
    _transitionFunction.set(this, transition !== undefined ? transition : () => true);
    _validate.set(this, validate !== undefined ? validate : () => true);
    _defaultValue.set(this, defaultValue !== undefined ? defaultValue : null);
    _multivalue.set(this, multivalue !== undefined ? multivalue : false);
    _readOnly.set(this, readOnly !== undefined ? readOnly : false);
    _bindOnly.set(this, bindOnly !== undefined ? bindOnly : false);
    _children.set(this, []);
    _icon.set(this, icon);
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

  get isRoot () {
    return this.parent === undefined;
  }

  get isTerminal () {
    return this.children.length === 0;
  }

  get initialized () {
    return _initialized.get(this) || true;
  }

  reset () {
    _initialized.delete(this);
  }

  /*
   * @private
   */
  async doInitialize (context = []) {
    if (_initialized.has(this)) return;
    const result = await this.initialize(context);
    _initialized.set(this, true);
    return result;
  }

  /**
   * Perform any asynchronous operations required to initialize this `State`.
   * Override in subclasses to add asynchronous functionality to a `State`.
   *
   * @param {any[]} context - The current boxed value of the containing `TokenStateMachine` (all `State`s up to and including this one).
   * @returns {Promise} A `Promise` which resolves when initialize completes successfully, rejecting otherwise.
   */
  async initialize (context = []) { // eslint-disable-line no-unused-vars
    // override
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

  /**
   * Recursively clones this `StateTemplate` chain, to retrieve an identical DAG of `State`s,
   * populated with their `defaultValue`s and ready to be traversed.
   *
   * @param {State} parent - A reference to the concrete parent `State`. Do not set when calling - used internally for recursion.
   * @returns {State} A clone of the DAG rooted at this `StateTemplate`, with each node instanced as a `State.
   */
  getInstance (parent = undefined) {
    const instance = new State(this, parent);
    const childInstances = this.children.map(c => c.getInstance(instance));
    _children.set(instance, childInstances);
    return instance;
  }

  /**
   * Add a child to this `StateTemplate`.
   *
   * @param {string} vkey - The (optional) unique key used to store this state's value within a `Token` output object. If not supplied, this state won't be represented in the `Token` value.
   * @param {StateTemplate} StateTemplateClass - A child state - must be a class which extends `StateTemplate`.
   * @param {Object} config - Construction parameters for the child `StateTemplate` class.
   * @returns {StateTemplate} A reference to the new child `State`, for chaining purposes.
   */
  to (vkey, StateTemplateClass, config = {}) {
    // vkey is optional, so we have to jump through some hoops
    let Klass = StateTemplateClass;
    let confObj = config;
    if (typeof vkey === 'string') {
      confObj.vkey = vkey;
    } else {
      Klass = vkey;
      confObj = StateTemplateClass;
    }
    confObj.parent = this;
    const child = new Klass(confObj);
    _children.get(this).push(child);
    return child;
  }

  /**
   * Set the children of this `StateTemplate` to the provided branches.
   *
   * @param {...StateTemplate} branches - The new child states for this `StateTemplate`.
   * @returns {StateTemplate} A reference to this `State`. Not intended for chaining purposes, as it would be unclear which branch to chain the next operation to.
   */
  branch (...branches) {
    const roots = branches.map(t => t.root);
    roots.forEach(t => _parent.set(t, this));
    _children.set(this, roots);
    return this;
  }
}

/**
 * An extension of `StateTemplate`, but "instantiated" to support
 * the storage of concrete values (and multi-value entry). This class
 * is not intended to be used directly, but is instantiated from a
 * `StateTemplate` automatically by a `TokenStateMachine`.
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
 * - `on('preview value changed', (newVal, oldVal) => {})` when the internal preview value changes.
 * - `on('unboxed value change attempted', (newUnboxedVal, oldUnboxedVal))` when a user attempts to change the unboxed value. If it cannot be boxed, it may not trigger `value changed`.
 *
 * @param {StateTemplate} template - The template for this `State`.
 * @param {State | undefined} parent - The parent `State` (if any).
 */
export class State extends EventEmitter {
  constructor (template, parent) {
    super();
    _parent.set(this, parent);
    _template.set(this, template);
    _value.set(this, template.defaultValue);
    _previewValue.set(this, null);
    _archive.set(this, []);
  }

  get template () { return _template.get(this); }
  get parent () { return _parent.get(this); }
  get root () {
    if (this.parent === undefined) {
      return this;
    } else {
      return this.parent.root;
    }
  }
  get name () { return this.template.name; }
  get vkey () { return this.template.vkey; }
  get vkeyClass () { return this.template.vkeyClass; }
  get defaultValue () { return this.template.defaultValue; }
  get children () { return _children.get(this); }
  get isTerminal () { return this.template.isTerminal; }
  get isReadOnly () { return this.template.isReadOnly; }
  get isBindOnly () { return this.template.isBindOnly; }
  get isMultivalue () { return this.template.isMultivalue; }
  initialize (...args) { return this.template.initialize(...args); }
  doInitialize (...args) { return this.template.doInitialize(...args); }
  boxValue (...args) { return this.template.boxValue(...args); }
  unboxValue (...args) { return this.template.unboxValue(...args); }

  /*
   * @private
   * @param {any} value - The internal representation of the value.
   * @returns {string | undefined} - The user-supplied-style value.
   */
  suggestIcon () {
    const iconFn = _icon.get(this.template);
    if (iconFn === undefined || typeof iconFn === 'string') {
      return iconFn;
    } else {
      return iconFn(this.value);
    }
  }

  /*
   * @private
   */
  reset () {
    this.template.reset();
    this.value = this.defaultValue;
    _archive.set(this, []);
  }

  get isDefault () { return this.value === this.defaultValue; }

  /**
   * Utilizes the `StateTemplate`'s `validate` function to check value validitiy.
   *
   * @returns {boolean} Returns `true` if this state is valid. Should throw an exception with information about validation error otherwise.
   */
  get isValid () {
    let isValid = false;
    try {
      isValid = _validate.get(this.template)(this.value, this.archive);
    } catch (err) {
      let message = 'Error thrown during validation';
      if (this.name) {
        message += ` of state named: ${this.name}`;
      }
      console.error(message, err);
    }
    return isValid;
  }

  /**
   * Called from a parent `State`, this method utilizes the `StateTemplate`'s transition function
   * to determine whether or not a transition to this `State` is valid given the parent's value.
   *
   * @param {boolean} ignoreBindOnly - All bind-only states are illegal transitions unless `ignoreBindOnly` is true.
   * @returns {boolean} Returns `true` iff a transition to this child is possible given the parent's value (and whether or not this `State` is `bindOnly`).
   */
  isValidTransition (ignoreBindOnly = false) {
    if (this.parent === undefined) {
      return !ignoreBindOnly || this.isBindOnly;
    } else if (ignoreBindOnly || !this.isBindOnly) {
      return _transitionFunction.get(this.template)(this.parent.value);
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
   * Moves the current value to the archive, and resets the current value.
   */
  archiveValue () {
    const oldVal = this.value;
    const oldUnboxedVal = this.unboxedValue;
    this.archive.push(this.value);
    this.value = this.defaultValue;
    this.previewValue = null;
    this.emit('value changed', this.value, oldVal, this.unboxedValue, oldUnboxedVal);
  }

  /**
   * Moves the top value from the archive back to the current value, overwriting it.
   */
  unarchiveValue () {
    const oldVal = this.value;
    const oldUnboxedVal = this.unboxedValue;
    this.value = this.archive.pop();
    this.emit('value changed', this.value, oldVal, this.unboxedValue, oldUnboxedVal);
  }

  /**
   * Remove a specific value from the archive, by index.
   *
   * @param {number} idx - The index of the archived value to remove.
   */
  removeArchivedValue (idx) {
    this.archive.splice(idx, 1);
    this.emit('value changed', this.value, this.value, this.unboxedValue, this.unboxedValue);
  }
}
