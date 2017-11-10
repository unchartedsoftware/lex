const _name = new WeakMap();
const _parent = new WeakMap();
const _validationFunction = new WeakMap();
const _transitionFunction = new WeakMap();
const _defaultValue = new WeakMap();
const _children = new WeakMap();
const _value = new WeakMap();

/**
 * Descibes a particular state in a state machine (DAG) which
 * represents the interactive build process for a token.
 * Classes extending this class must always have `parent` as the first constructor argument.
 */
export class StateTemplate {
  /**
   * @param {State|undefined} parent - The parent state. Undefined if this is a root.
   * @param {string} name - A useful label for this state.
   * @param {Function} validationFunction - A function accepting the value of this state, returning true if this state's value is valid.
   * @param {Function|undefined} transitionFunction - A function which returns true if this state is the next child to transition to, given the value of its parent. Undefined if this is a root.
   * @param {any} defaultValue - The default value for this state before it has been touched. Can be undefined.
   */
  constructor (parent, name, validationFunction, transitionFunction, defaultValue) {
    _parent.set(this, parent);
    _name.set(this, name);
    _validationFunction.set(this, validationFunction);
    _transitionFunction.set(this, transitionFunction);
    _defaultValue.set(this, defaultValue);
    _children.set(this, []);
  }

  get parent () {
    return _parent.get(this);
  }

  get name () {
    return _name.get(this);
  }

  get validationFunction () {
    return _validationFunction.get(this);
  }

  get transitionFunction () {
    return _transitionFunction.get(this);
  }

  get defaultValue () {
    return _defaultValue.get(this);
  }

  get children () {
    return _children.get(this);
  }

  /**
   * Recursively clones this `StateTemplate` chain, to retrieve an identical DAG of `State`s,
   * populated with their `defaultValue`s and ready to be traversed.
   *
   * @returns {State} A clone of the DAG rooted at this `StateTemplate`, with each node instanced as a `State.
   */
  getInstance () {
    const instance = new State(this.parent, this.validationFunction, this.transitionFunction, this.defaultValue);
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
 * Same as `StateTemplate`, but with concrete values
 */
export class State extends StateTemplate {
  constructor (parent, name, validationFunction, transitionFunction, defaultValue) {
    super(parent, name, validationFunction, transitionFunction, defaultValue);
    _value.set(this, defaultValue);
  }

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
      return this.transitionFunction(this.value);
    }
  }

  /**
   * @returns {any} The current value from this `State`.
   */
  get value () {
    return _value.get(this);
  }

  /**
   * @param {any} newVal - A new value for this `State`.
   */
  set value (newVal) {
    _value.set(this, newVal);
  }
}
