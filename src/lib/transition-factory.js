/**
 * Convenient builders for constructing transition functions.
 */
export class TransitionFactory {
  /**
   * Transition to this state if the selected value from the parent state has one of the given keys.
   *
   * @param {...string} valueKeys - The list of valid `ValueStateValue` keys.
   * @returns {Object} A config object with key `transition` and the intended transition function, to be used directly or further customized.
   * @example
   * // Transition to this child state if the parent option key is 'is', 'is like' or 'equals'
   * TransitionFactory.valueKeyIs('is', 'is like', 'equals')
   */
  static valueKeyIs (...valueKeys) {
    return {
      transition: (parentVal) => parentVal && valueKeys.indexOf(parentVal.key) >= 0
    };
  }

  /**
   * Transition to this state if the selected option from the parent state does not match one of the given keys.
   *
   * @param {...string} valueKeys - The list of invalid `ValueStateValue` keys.
   * @returns {Object} A config object with key `transition` and the intended transition function, to be used directly or further customized.
   * @example
   * // Transition to this child state if the parent option key is not 'between'
   * TransitionFactory.valueKeyIsNot('between')
   */
  static valueKeyIsNot (...valueKeys) {
    return {
      transition: (parentVal) => parentVal && valueKeys.indexOf(parentVal.key) < 0
    };
  }

  /**
   * Transition to this state if the selected option from the parent state has metadata values which match
   * the given metadata object. Key/values present in `toCompare` are (shallowly) compared against `parentVal.meta`.
   * Any non-matching value invalidates the transition.
   *
   * @param {Object} toCompare - The metadata object.
   * @returns {Object} A config object with key `transition` and the intended transition function, to be used directly or further customized.
   * @example
   * TransitionFactory.optionMetaCompare({type: 'string'})
   */
  static optionMetaCompare (toCompare) {
    return {
      transition: (parentVal) => {
        return parentVal && Object.keys(toCompare).map(k => parentVal.meta[k] === toCompare[k]).indexOf(false) < 0;
      }
    };
  }
}
