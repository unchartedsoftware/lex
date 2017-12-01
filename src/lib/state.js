import EventEmitter from 'wolfy87-eventemitter';

const _name = new WeakMap();
const _parent = new WeakMap();
const _defaultValue = new WeakMap();
const _children = new WeakMap();
const _template = new WeakMap();
const _value = new WeakMap();

/**
 * Descibes a particular state in a state machine (DAG) which
 * represents the interactive build process for a token.
 * Classes extending this class must always have `parent` as the first constructor argument.
 *
 * Supports a notion of boxed/unboxed values, where the `State` will utilize an
 * internal representation of a value which is richer than the user-supplied one.
 */
export class StateTemplate extends EventEmitter {
  /**
   * @param {State|undefined} parent - The parent state. Undefined if this is a root.
   * @param {string} name - A useful label for this state.
   * @param {any} defaultValue - The default value for this state before it has been touched. Can be undefined.
   */
  constructor (parent, name, defaultValue) {
    super();
    _parent.set(this, parent);
    _name.set(this, name);
    _defaultValue.set(this, defaultValue);
    _children.set(this, []);
  }

  get parent () {
    return _parent.get(this);
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
   * Validate the value of this state. Override in subclasses.
   *
   * @returns {boolean} Returns true iff this state has a valid value. Should throw an exception otherwise.
   */
  validationFunction () {
    return true;
  }

  /**
   * A function which returns true if this state is the next child to transition to, given the value of its parent.
   */
  transitionFunction () {
    return true;
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
   * @returns {State} A clone of the DAG rooted at this `StateTemplate`, with each node instanced as a `State.
   */
  getInstance () {
    const instance = new State(this);
    const childInstances = this.children.map(c => {
      c.getInstance();
    });
    _children.set(instance, childInstances);
    return instance;
  }

  /**
   * Add a child to this `State`.
   *
   * @param {StateTemplate} StateTemplateClass - A child state - might be a class which extends `StateTemplate`. Parent should always be the first constructor argument.
   * @param {...any} args - Construction parameters for the child `StateTemplate` class.
   * @returns {StateTemplate} A reference to the new child `State`, for chaining purposes.
   */
  addChild (StateTemplateClass, ...args) {
    const child = new StateTemplateClass(this, ...args);
    _children.get(this).push(child);
    return child;
  }
}

/**
 * Same as `StateTemplate`, but with concrete values.
 *
 * Supports a notion of boxed/unboxed values, where the `State` will utilize an
 * internal representation of a value which is richer than the user-supplied one.
 *
 * `this.vaue` always accepts/returns a boxed value. Where desired, the boxed and
 * unboxed versions of the value can be identical.
 */
export class State extends EventEmitter {
  constructor (template) {
    super();
    _template.set(this, template);
    _value.set(this, template.defaultValue);
  }

  get template () { return _template.get(this); }
  get parent () { return this.template.parent; }
  get name () { return this.template.name; }
  get defaultValue () { return this.template.defaultValue; }
  get children () { return this.template.children; }
  get isTerminal () { return this.template.isTerminal; }
  boxValue (...args) { return this.template.boxValue(...args); }
  unboxValue (...args) { return this.template.unboxValue(...args); }
  transitionFunction (...args) { return this.template.transitionFunction(...args); }
  validationFunction (...args) { return this.template.validationFunction(...args); }

  /**
   * @returns {boolean} Returns `true` iff this state is valid. Should throw an exception with information about validation error otherwise.
   */
  get isValid () {
    return this.validationFunction(this.value);
  }

  /**
   * @returns {boolean} Returns `true` iff a transition to this child is possible given the parent's value.
   */
  get isValidTransition () {
    if (this.parent === undefined) {
      return true;
    } else {
      return this.transitionFunction(this.parent.value);
    }
  }

  /**
   * @returns {any} The current (boxed) value from this `State`.
   */
  get value () {
    return _value.get(this);
  }

  /**
   * @returns {any} The current (boxed) value from this `State`. An alias for this.value getter.
   */
  get boxedValue () {
    return this.value;
  }

  /**
   * @returns {any} The current (unboxed) value from this `State`.
   */
  get unboxedValue () {
    return this.unboxValue(this.value);
  }

  /**
   * @param {any} newVal - A new (boxed) value for this `State`.
   */
  set value (newVal) {
    if (newVal !== this.value) {
      const oldVal = this.value;
      _value.set(this, newVal);
      this.emit('value changed', newVal, oldVal);
    }
  }

  /**
   * @param {any} newBoxedVal - A new (boxed) value for this `State`. Alias for this.value setter.
   */
  set boxedValue (newBoxedVal) {
    this.value = newBoxedVal;
  }

  /**
   * @param {any} newUnboxedVal - A new (unboxed) value for this `State`.
   */
  set unboxedValue (newUnboxedVal) {
    this.value = this.boxValue(newUnboxedVal);
  }
}
