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
 */
export class StateTemplate {
  /**
   * @param {string} name - A useful label for this state.
   * @param {State|undefined} parent - The parent state. Undefined if this is a root.
   * @param {Function} validationFunction - A function accepting the value of this state, returning true if this state's value is valid.
   * @param {Function|undefined} transitionFunction - A function which returns true if this state is the next child to transition to, given the value of its parent. Undefined if this is a root.
   * @param {any} defaultValue - The default value for this state before it has been touched. Can be undefined.
   */
  constructor (name, parent, validationFunction, transitionFunction, defaultValue) {
    _name.set(this, name);
    _parent.set(this, parent);
    _validationFunction.set(this, validationFunction);
    _transitionFunction.set(this, transitionFunction);
    _defaultValue.set(this, defaultValue);
    _children.set(this, []);
  }

  get name () {
    return _name.get(this);
  }

  get parent () {
    return _parent.get(this);
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
   * @param {any|Function} transitionRule - A function returning true if the new child is the next child to transition to given the value of this `State`. If a value is supplied instead of a function, the transition rule will check for equality between the value and this.value.
   * @param {any} defaultValue - The default value for this state before it has been touched. Can be undefined.
   * @returns {State} A reference to the new child `State`, for chaining purposes.
   */
  addChild (transitionRule, defaultValue) {
    let child;
    if (typeof transitionRule === 'function') {
      child = new StateTemplate(this, transitionRule, defaultValue);
    } else {
      child = new StateTemplate(this, () => this.value === transitionRule, defaultValue);
    }
    _children.get(this).push(child);
    return child;
  }
}

/**
 * Same as `StateTemplate`, but with concrete values
 */
export class State extends StateTemplate {
  constructor (name, parent, validationFunction, transitionFunction, defaultValue) {
    super(name, parent, validationFunction, transitionFunction, defaultValue);
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
