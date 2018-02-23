import EventEmitter from 'wolfy87-eventemitter';
import { StateTransitionError, ValueArchiveError } from './errors';

const _rootState = new WeakMap();
const _currentState = new WeakMap();
/**
 * Encapsulates the state and functionality of a state machine
 * derived from a language specification in the form of a root `StateTemplate`
 * (which has a DAG of children).
 *
 * @private
 * @param {StateTemplate} rootStateTemplate - The DAG describing the states for this state machine.
 * @param {Object | undefined} values - A optional array of initial (boxed) values to apply to the machine's states (applied from the root state onward). If any value is an array, all but the final value are added to the `State` archive.
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
      const copy = Object.assign(Object.create(null), values);
      while (Object.keys(copy).length > 0) {
        const v = copy[this.state.vkey];
        if (v === undefined) {
          break; // we're missing a value for the current state, so break out.
        } else if (Array.isArray(v)) {
          v.forEach(x => {
            if (typeof x === 'string') {
              this.state.unboxedValue = x;
            } else {
              this.state.value = x;
            }
            this.state.archiveValue();
          });
          this.state.unarchiveValue(); // make the last value the "active" one
        } else if (typeof v === 'string') {
          this.state.unboxedValue = v;
        } else {
          this.state.value = v;
        }
        delete copy[this.state.vkey]; // we're done with this value
        try {
          this.transition();
        } catch (err) {
          break; // the value for this state is invalid, so break out.
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

  /*
   * @private
   */
  getFirstLegalTransition (state) {
    const transitions = state.children.filter(c => c.isValidTransition);
    if (transitions.length === 0) {
      const err = new StateTransitionError(`No valid transitions from current state "${this.state.name}" given current state's value: ${this.state.value}.`);
      throw err;
    } else {
      return transitions[0];
    }
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
    if (!this.state.isValid) {
      const err = new StateTransitionError(`Cannot transition from invalid current state "${this.state.name}" with value: ${this.state.value}.`);
      this.emit('state change failed', err);
      throw err;
    } else if (this.state.isTerminal) {
      this.emit('state changed', this.state, this.state);
      this.emit('end', this.state);
    } else {
      try {
        const oldState = this.state;
        // Find the first legal transition to a non-read-only child, if possible
        let next = this.getFirstLegalTransition(this.state);
        while (next.isReadOnly) {
          next = this.getFirstLegalTransition(next);
        }
        _currentState.set(this, next);
        this.emit('state changed', this.state, oldState);
        return this.state;
      } catch (err) {
        this.emit('state change failed', err);
        throw err;
      }
    }
  }

  /**
   * Rather than transitioning to the next state, supply a new value for this `State`
   * and save the current one in the `State`'s archive.
   */
  archive () {
    if (!this.state.isValid) {
      const err = new ValueArchiveError(`Cannot archive invalid value for current state: ${this.state.value}`);
      this.emit('state change failed', err);
      throw err;
    } else {
      this.state.archiveValue();
      this.emit('state changed', this.state, this.state);
    }
  }

  /**
   * Inverse of `archive()`, overwriting the current value with one from the archive.
   */
  unarchive () {
    if (this.state.archive.length > 0) {
      this.state.unarchiveValue();
      this.emit('state changed', this.state, this.state);
    } else {
      const err = new ValueArchiveError('Cannot unarchive from an empty archive');
      this.emit('state change failed', err);
      throw err;
    }
  }

  /**
   * Request removal of a specific element from the archive.
   *
   * @param {number} idx - An archive index.
   */
  removeArchivedValue (idx) {
    if (this.state.archive.length > idx) {
      this.state.removeArchivedValue(idx);
      this.emit('state changed', this.state, this.state);
    } else {
      const err = new ValueArchiveError(`Cannot remove value ${idx} from archive with length ${this.state.archive.length}`);
      this.emit('state change failed', err);
      throw err;
    }
  }

  /**
   * Pops a value from the current `State`'s archive, if possible, overwriting the current value. If the
   * archive is empty, transitions to the parent state from the current state, regardless of whether or
   * not the current state is valid, or has a parent. Resets the value of the current state before rewinding.
   * If the current state has no parent, then this will only reset the value of the current state.
   *
   * @returns {State} The new current state.
   */
  rewind () {
    if (this.state.archive.length > 0) {
      this.state.unarchiveValue();
      this.emit('state changed', this.state, this.state);
    } else {
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
   * Get the values (including archived values) bound to underlying states, up to the current state.
   *
   * @returns {Object} An object of arrays of boxed values.
   */
  get value () {
    const result = Object.create(null);
    let current = this.state;
    while (current !== undefined) {
      if (!current.isReadOnly && current.vkey) result[current.vkey] = current.isMultivalue ? [current.value, ...current.archive] : current.value;
      current = current.parent;
    }
    return result;
  }

  /**
   * Alias for this.value.
   *
   * @returns {Object} An object of boxed values.
   */
  get boxedValue () {
    return this.value;
  }

  /**
   * Get the (unboxed) values (including archived values) bound to underlying states, up to the current state.
   *
   * @returns {Object} An object of arrays of unboxed (basic type) values.
   */
  get unboxedValue () {
    const result = Object.create(null);
    let current = this.state;
    while (current !== undefined) {
      if (!current.isReadOnly && current.vkey) result[current.vkey] = current.isMultivalue ? [current.unboxedValue, ...current.unboxedArchive] : current.unboxedValue;
      current = current.parent;
    }
    return result;
  }
}
