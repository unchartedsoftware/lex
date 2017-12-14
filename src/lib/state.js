import EventEmitter from 'wolfy87-eventemitter';

const _parent = new WeakMap();
const _validate = new WeakMap();
const _transitionFunction = new WeakMap();
const _name = new WeakMap();
const _readOnly = new WeakMap();
const _defaultValue = new WeakMap();
const _children = new WeakMap();
const _template = new WeakMap();
const _value = new WeakMap();

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
 * @param {string} config.name - A useful label for this state.
 * @param {Function | undefined} config.transition - A function which returns true if this state is the next child to transition to, given the value of its parent. Undefined if this is root.
 * @param {Function | undefined} config.validation - A function which returns true iff this state has a valid value. Should throw an exception otherwise.
 * @param {any} config.defaultValue - The default value for this state before it has been touched. Can be undefined.
 * @param {boolean} config.readOnly - This state is read only (for display purposes only) and should be skipped by the state machine. False by default.
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
    const {parent, name, transition, validate, defaultValue, readOnly} = config;
    super();
    _parent.set(this, parent);
    _name.set(this, name);
    _transitionFunction.set(this, transition !== undefined ? transition : () => true);
    _validate.set(this, validate !== undefined ? validate : () => true);
    _defaultValue.set(this, defaultValue !== undefined ? defaultValue : null);
    _readOnly.set(this, readOnly !== undefined ? readOnly : false);
    _children.set(this, []);
  }

  get isReadOnly () {
    return _readOnly.get(this);
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

  get defaultValue () {
    return _defaultValue.get(this);
  }

  get children () {
    return _children.get(this);
  }

  get isRoot () {
    return this.parent === undefined;
  }

  get isTerminal () {
    return this.children.length === 0;
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
   * @param {StateTemplate} StateTemplateClass - A child state - must be a class which extends `StateTemplate`.
   * @param {Object} config - Construction parameters for the child `StateTemplate` class.
   * @returns {StateTemplate} A reference to the new child `State`, for chaining purposes.
   */
  to (StateTemplateClass, config = {}) {
    config.parent = this;
    const child = new StateTemplateClass(config);
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
 * the storage of concrete values. This class is not intended to be
 * used directly, but is instantiated from a `StateTemplate` automatically
 * by a `TokenStateMachine`.
 *
 * `this.value` always accepts/returns a boxed value. Where desired, the boxed and
 * unboxed versions of the value can be identical.
 *
 * This class is an `EventEmitter` and exposes the following events:
 * - `on('value changed', (newVal, oldVal) => {})` when the internal value changes.
 * - `on('unbxoed value change attempted', (newUnboxedVal, oldUnboxedVal))` when a user attempts to change the unboxed value. If it cannot be boxed, it may not trigger `value changed`.
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
  }

  get template () { return _template.get(this); }
  get parent () { return _parent.get(this); }
  get name () { return this.template.name; }
  get defaultValue () { return this.template.defaultValue; }
  get children () { return _children.get(this); }
  get isTerminal () { return this.template.isTerminal; }
  get isReadOnly () { return this.template.isReadOnly; }
  boxValue (...args) { return this.template.boxValue(...args); }
  unboxValue (...args) { return this.template.unboxValue(...args); }

  reset () {
    this.value = this.defaultValue;
  }

  get isDefault () { return this.value === this.defaultValue; }

  /**
   * Utilizes the `StateTemplate`'s `validate` function to check value validitiy.
   *
   * @returns {boolean} Returns `true` iff this state is valid. Should throw an exception with information about validation error otherwise.
   */
  get isValid () {
    return _validate.get(this.template)(this.value);
  }

  /**
   * Called from a parent `State`, this method utilizes the `StateTemplate`'s transition function
   * to determine whether or not a transition to this `State` is valid given the parent's value.
   *
   * @returns {boolean} Returns `true` iff a transition to this child is possible given the parent's value.
   */
  get isValidTransition () {
    if (this.parent === undefined) {
      return true;
    } else {
      return _transitionFunction.get(this.template)(this.parent.value);
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
   * Setter for `value`.
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
   * Setter for `value`. Alias for  `this.value`.
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
   * Setter for `unboxedValue`.
   *
   * @param {any} newUnboxedVal - Set a new (unboxed) value for this `State`.
   */
  set unboxedValue (newUnboxedVal) {
    this.emit('unboxed value change attempted', newUnboxedVal, this.unboxedValue);
    this.value = this.boxValue(newUnboxedVal);
  }
}
