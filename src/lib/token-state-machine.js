import EventEmitter from 'wolfy87-eventemitter';
import { StateTransitionError } from './errors';

const _rootState = new WeakMap();
const _currentState = new WeakMap();
/**
 * Encapsulates the state and functionality of a state machine
 * derived from a language specification in the form of a root `StateTemplate`
 * (which has a DAG of children).
 *
 * @private
 * @param {StateTemplate} rootStateTemplate - The DAG describing the states for this state machine.
 * @param {any[] | undefined} values - A set of initial (boxed) values to apply to the machine one by one (optional).
 */
export class TokenStateMachine extends EventEmitter {
  constructor (rootStateTemplate, values) {
    super();
    this._dispatchId = Math.random();
    const root = rootStateTemplate.getInstance();
    _rootState.set(this, root);
    _currentState.set(this, root);
    // bind to states
    if (values !== undefined) {
      for (const v of values) {
        this.state.value = v;
        try {
          this.transition();
        } catch (err) {
          break;
        }
      }
    }
  }

  /**
   * @returns {State} The root state of this `TokenStateMachine`.
   */
  get rootState () {
    return _rootState.get(this);
  }

  /**
   * @returns {State} The current state of this `TokenStateMachine`.
   */
  get state () {
    return _currentState.get(this);
  }

  /**
   * Transition to the first viable child state, iff the current state is valid. If this is a terminal state, this will
   * trigger an 'end' event.
   *
   * @throws {StateTransitionError} If this state is invalid, or if there is no valid child transition given the current state's value.
   * @returns {State} The new current state.
   */
  transition () {
    // validate current state value
    if (this.state.isValid) {
      if (this.state.isTerminal) {
        this.emit('end', this.state);
      } else {
        // Find the first legal transition to a child, if possible
        const transitions = this.state.children.filter(c => c.isValidTransition);
        if (transitions.length > 0) {
          const oldState = this.state;
          // execute transition to the first child whose transition function returned true
          _currentState.set(this, transitions[0]);
          this.emit('state changed', this.state, oldState);
        } else {
          const err = new StateTransitionError(`No valid transitions from current state "${this.state.name}" given current state's value: ${this.state.value}.`);
          this.emit('state change failed', err);
          throw err;
        }
        // If the new state is read-only, transition past it automatically.
        if (this.state.isReadOnly) {
          return this.transition();
        } else {
          return this.state;
        }
      }
    } else {
      const err = new StateTransitionError(`Cannot transition from invalid current state "${this.state.name}" with value: ${this.state.value}.`);
      this.emit('state change failed', err);
      throw err;
    }
  }

  /**
   * Transition to the parent state from the current state, regardless of whether or not the current state
   * is valid, or has a parent. Resets the value of the current state before rewinding.
   * If the current state has no parent, then this will only reset the value of the current state.
   *
   * @returns {State} The new current state.
   */
  rewind () {
    if (this.state.parent) {
      const oldState = this.state;
      oldState.reset();
      _currentState.set(this, this.state.parent);
      this.emit('state changed', this.state, oldState);
    }
    // If the new state is read-only, rewind past it automatically.
    if (this.state.isReadOnly) {
      return this.rewind();
    } else {
      return this.state;
    }
  }

  /**
   * Reset all values in this state machine, from its current state upwards, and
   * reset all progress to the root `State`.
   *
   * @returns {State} The new current state.
   */
  reset () {
    // erase all values
    const oldState = this.state;
    let s = this.state;
    do {
      s.reset();
      s = s.parent;
    } while (s);
    _currentState.set(this, this.rootState);
    this.emit('state changed', this.state, oldState);
    return this.state;
  }

  /**
   * Get the values bound to underlying states, up to the current state.
   *
   * @returns {Array[any]} An array of boxed values.
   */
  get value () {
    const result = [];
    let current = this.state;
    while (current !== undefined) {
      result.unshift(current.value);
      current = current.parent;
    }
    return result;
  }

  /**
   * Alias for this.value.
   *
   * @returns {Array[any]} An array of boxed values.
   */
  get boxedValue () {
    return this.value;
  }

  /**
   * Get the (unboxed) values bound to underlying states, up to the current state.
   *
   * @returns {Array[String]} An array of unboxed values.
   */
  get unboxedValue () {
    const result = [];
    let current = this.state;
    while (current !== undefined) {
      result.unshift(current.unboxedValue);
      current = current.parent;
    }
    return result;
  }
}
