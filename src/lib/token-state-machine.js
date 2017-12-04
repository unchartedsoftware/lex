import EventEmitter from 'wolfy87-eventemitter';
import { StateTransitionError } from './errors';

const _rootState = new WeakMap();
const _currentState = new WeakMap();
/**
 * Encapsulates the state of a particular
 * variety of search token, handling transitions,
 * validation etc.
 */
export class TokenStateMachine extends EventEmitter {
  /**
   * @param {StateTemplate} rootStateTemplate - The DAG describing the states for this state machine.
   */
  constructor (rootStateTemplate) {
    super();
    const root = rootStateTemplate.getInstance();
    _rootState.set(this, root);
    _currentState.set(this, root);
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
   * trigger onFinished().
   *
   * @throws {StateTransitionError} If this state is invalid, or if there is no valid child transition given the current state's value.
   * @returns {State} The new current state.
   */
  transition () {
    // validate current state value
    if (this.state.isValid) {
      if (this.state.isTerminal) {
        this.emit('submit', this.state);
      } else {
        // Find the first legal transition to a child, if possible
        const transitions = this.state.children.filter(c => c.isValidTransition);
        if (transitions.length > 0) {
          const oldState = this.state;
          // execute transition to the first child whose transition function returned true
          _currentState.set(this, transitions[0]);
          this.emit('state changed', this.state, oldState);
          return this.state;
        } else {
          throw new StateTransitionError(`No valid transitions from current state ${this.state.name} given current state's value ${this.state.value}.`);
        }
      }
    } else {
      throw new StateTransitionError(`Cannot transition from invalid current state ${this.state.name} with value ${this.state.value}.`);
    }
  }

  /**
   * Transition to the parent state from the current state, regardless of whether or not the current state
   * is valid, or has a parent.  If the current state has no parent, then this is a no-op.
   *
   * @returns {State} The new current state.
   */
  rewind () {
    if (this.state.parent) {
      const oldState = this.state;
      _currentState.set(this, this.state.parent);
      this.emit('state changed', this.state, oldState);
    }
    return this.state;
  }
}
