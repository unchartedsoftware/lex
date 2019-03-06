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
 */
export class TokenStateMachine extends EventEmitter {
  constructor (rootStateTemplate) {
    super();
    this._id = Math.random();
    const root = rootStateTemplate.getInstance();
    _rootState.set(this, root);
    _currentState.set(this, root);
  }

  get id () {
    return this._id;
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
   * @returns {boolean} Whether or not the current state of this `TokenStateMachine` or any of its parents are `bindOnly`.
   */
  get isBindOnly () {
    let s = this.state;
    do {
      if (s.isBindOnly) return true;
      s = s.parent;
    } while (s);
    return false;
  }

  /**
   * Overwrite this machine with the given values, in sequence. If `values` is `undefined`, this is equivalent to `this.reset()`.
   *
   * @param {Object | undefined} values - A optional array of (boxed) values to apply to the machine's states (applied from the root state onward). If any value is an array, all but the final value are added to the `State` archive.
   * @param {boolean} finalTransition - Whether or not to apply the final transition.
   */
  async bindValues (values, finalTransition = false) {
    try {
      // bind to states
      if (values !== undefined) {
        const actionValues = values.actionValues !== undefined ? Object.assign(Object.create(null), values.actionValues) : Object.create(null);
        const copy = Object.assign(Object.create(null), values);
        delete copy.actionValues; // we don't need actionValues in copy.
        while (Object.keys(copy).length > 0) {
          const v = copy[this.state.vkey];
          if (v === undefined) {
            await this.state.doInitialize(this.boxedValue);
            break; // we're missing a value for the current state, so break out.
          } else if (Array.isArray(v)) {
            if (v.length > 0 && typeof v[0] === 'object') {
              await this.state.doInitialize(this.boxedValue, v.map(e => this.state.unboxValue(e)));
            } else {
              await this.state.doInitialize(this.boxedValue, v);
            }
            for (const x of v) {
              this.state.value = x;
              this.state.archiveValue();
            }
            this.state.unarchiveValue(); // make the last value the "active" one
          } else {
            await this.state.doInitialize(this.boxedValue, [this.state.unboxValue(v)]);
            this.state.value = v;
          }
          // set action values
          this.state.actionValues = actionValues;
          // now we're done with this state value
          delete copy[this.state.vkey];
          // if there's more values, transition
          if (Object.keys(copy).length > 0 || finalTransition) {
            try {
              this.transition({ignoreBindOnly: true, ignoreAutoAdvance: true, ignoreValidation: true}); // ignore bind-only states
            } catch (err) {
              console.error(err); // eslint-disable-line no-console
              throw err; // the value for this state is invalid, so break out.
            }
          }
        }
      } else {
        await this.state.doInitialize(this.boxedValue);
      }
    } catch (bindErr) {
      bindErr.bindValues = values;
      throw bindErr;
    }
    return this;
  }

  /*
   * @private
   * @param {boolean} ignoreBindOnly - All bind-only states are illegal transitions unless `ignoreBindOnly` is true.
   */
  getFirstLegalTransition (state, ignoreBindOnly = false) {
    const transitions = state.children.filter(c => c.isValidTransition(ignoreBindOnly));
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
   * @param {Object} conf - Transition configuration.
   * @param {boolean} conf.ignoreBindOnly - All bind-only states are illegal transitions unless `ignoreBindOnly` is true.
   * @param {boolean} conf.nextToken - Whether or not to move to the next `Token` in the `Lex` bar, if this `Token` is complete.
   * @param {boolean} conf.ignoreAutoAdvance - Do not perform auto-advancements, even if `State` is configured as such.
   * @param {boolean} conf.ignoreValidation - Used by bindValues() to ignore validation.
   * @throws {StateTransitionError} If this state is invalid, or if there is no valid child transition given the current state's value.
   * @returns {State} The new current state.
   */
  transition ({ignoreBindOnly, nextToken, ignoreAutoAdvance, ignoreValidation} = {ignoreBindOnly: false, nextToken: true, ignoreAutoAdvance: false, ignoreValidation: false}) {
    this.emit('before state change', this.state);
    // validate current state value
    if (!ignoreValidation && !this.state.isValid) {
      const err = new StateTransitionError(`Cannot transition from invalid current state "${this.state.name}" with value: ${this.state.unboxedValue}.`);
      this.emit('state change failed', err);
      throw err;
    } else if (this.state.isTerminal) {
      this.emit('state changed', this.state, this.state);
      this.emit('end', this.state, nextToken);
    } else {
      try {
        const oldState = this.state;
        // Find the first legal transition to a non-read-only, non-bind-only, non-auto-advance-default child if possible
        let next = this.getFirstLegalTransition(this.state, ignoreBindOnly);
        while ((next.isReadOnly || next.autoAdvanceDefault) && !next.isTerminal) {
          if (next.autoAdvanceDefault && ignoreAutoAdvance) break;
          if (next.autoAdvanceDefault) next.doInitialize(next.defaultValue);
          next = this.getFirstLegalTransition(next, ignoreBindOnly);
        }
        next.doInitialize(this.boxedValue);
        _currentState.set(this, next);
        this.emit('state changed', this.state, oldState);
        // if we ended on a terminal read-only or auto-advance state, transition one more time to finish token.
        if ((next.isReadOnly || (!ignoreAutoAdvance && next.autoAdvanceDefault)) && next.isTerminal) {
          return this.transition(arguments);
        } else {
          // otherwise, we're finished.
          return this.state;
        }
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
    try {
      this.state.archiveValue(this.boxedValue);
      this.emit('state changed', this.state, this.state);
    } catch (err) {
      this.emit('state change failed', err);
      throw err;
    }
  }

  /**
   * Inverse of `archive()`, overwriting the current value with one from the archive.
   */
  unarchive () {
    try {
      this.state.unarchiveValue(this.boxedValue);
      this.emit('state changed', this.state, this.state);
    } catch (err) {
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
    try {
      this.state.removeArchivedValue(idx, this.boxedValue);
      this.emit('state changed', this.state, this.state);
    } catch (err) {
      this.emit('state change failed', err);
      throw err;
    }
  }

  /**
   * Request removal of all elements from the archive.
   */
  removeArchivedValues () {
    try {
      this.state.removeArchivedValues();
      this.emit('state changed', this.state, this.state);
    } catch (err) {
      this.emit('state change failed', err);
      throw err;
    }
  }

  /**
   * Replaces an existing archived value with a new one.
   *
   * @param {number} idx - The index of the value to replace.
   * @param {Object} newBoxedValue - The new boxed value to replace the specified archived value with.
   */
  updateArchivedValue (idx, newBoxedValue) {
    try {
      this.state.updateArchivedValue(idx, newBoxedValue);
      this.emit('state changed', this.state, this.state);
    } catch (err) {
      this.emit('state change failed', err);
      throw err;
    }
  }

  /**
   * Transitions to the parent state (or target ancestor state) from the current state, regardless of whether or
   * not the current state is valid, or has a parent. Leaves the value of the current state as-is,
   * permitting a potential transition back to this state after editing a previous one.
   *
   * @param {State | undefined} targetState - Target `State` to rewind to (optional).
   * @returns {State} The new current state.
   */
  rewind (targetState) {
    const target = targetState !== undefined ? targetState : (this.state.parent !== undefined ? this.state.parent : this.state);
    while (this.state !== target) {
      if (!this.state.parent) break;
      const oldState = this.state;
      if (target.resetOnRewind) oldState.reset();
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
    this.state.doInitialize(this.boxedValue);
    this.emit('state changed', this.state, oldState);
    return this.state;
  }

  /**
   * Get the values (including archived values) bound to underlying states, up to the current state.
   *
   * @returns {Object} An object of arrays of boxed values, along with action values (under `.action`).
   */
  get value () {
    const result = Object.create(null);
    const actionValues = Object.create(null);
    let current = this.state;
    while (current !== undefined) {
      if (!current.isReadOnly && current.vkey) result[current.vkey] = current.isMultivalue ? [...current.archive, current.value] : current.value;
      current.actions.forEach(a => {
        actionValues[a.vkey] = a.value;
      });
      current = current.parent;
    }
    if (Object.keys(actionValues).length > 0) result.actionValues = actionValues;
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
    const actionValues = Object.create(null);
    let current = this.state;
    while (current !== undefined) {
      if (!current.isReadOnly && current.vkey) result[current.vkey] = current.isMultivalue ? [...current.unboxedArchive, current.unboxedValue] : current.unboxedValue;
      current.actions.forEach(a => {
        actionValues[a.vkey] = a.value;
      });
      current = current.parent;
    }
    if (Object.keys(actionValues).length > 0) result.actionValues = actionValues;
    return result;
  }
}
