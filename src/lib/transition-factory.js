/**
 * Convenient builders for constructing transition functions.
 */
export class TransitionFactory {
  /**
   * Transition to this state if the selected option from the parent state has one of the given keys.
   *
   * @param {...string} optionKeys - The list of valid `OptionStateOption` keys.
   * @returns {Object} A config object with key `transition` and the intended transition function, to be used directly or further customized.
   */
  static optionKeyIs (...optionKeys) {
    return {
      transition: (parentVal) => parentVal && optionKeys.indexOf(parentVal.key) >= 0
    };
  }

  /**
   * Transition to this state if the selected option from the parent state does not match one of the given keys.
   *
   * @param {...string} optionKeys - The list of invalid `OptionStateOption` keys.
   * @returns {Object} A config object with key `transition` and the intended transition function, to be used directly or further customized.
   */
  static optionKeyIsNot (...optionKeys) {
    return {
      transition: (parentVal) => parentVal && optionKeys.indexOf(parentVal.key) < 0
    };
  }

  /**
   * Transition to this state if the selected option from the parent state has metadata values which match
   * the given metadata object. Key/values present in `toCompare` are (shallowly) compared against `parentVal.meta`.
   * Any non-matching value invalidates the transition.
   *
   * @param {Object} toCompare - The metadata object.
   * @returns {Object} A config object with key `transition` and the intended transition function, to be used directly or further customized.
   */
  static optionMetaCompare (toCompare) {
    return {
      transition: (parentVal) => {
        return parentVal && Object.keys(toCompare).map(k => parentVal.meta[k] === toCompare[k]).indexOf(false) < 0;
      }
    };
  }
}
