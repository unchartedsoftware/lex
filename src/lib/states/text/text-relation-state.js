import {ValueStateValue} from '../generic/value-state';
import {RelationState} from '../generic/relation-state';

const options = [
  ['is', '='], ['is not', '≠'], ['is like', '≅'], ['contains', '⊇'], ['does not contain', '⊉']
].map(o => new ValueStateValue(o[0], {}, {displayKey: o[1]}));

/**
 * This state supports the selection of a text relation from a list of options.
 *
 * @param {object} config - A configuration object. Supports all of the parameters from `ValueState` and `StateTemplate`,
 *                          providing defaults for `name` and `options`.
 */
export class TextRelationState extends RelationState {
  /**
   * The "is" option.
   */
  static get IS () {
    return options[0];
  }
  /**
   * The "is not" option.
   */
  static get IS_NOT () {
    return options[1];
  }
  /**
   * The "is like" option.
   */
  static get IS_LIKE () {
    return options[2];
  }
  /**
   * The "contains" option.
   */
  static get CONTAINS () {
    return options[3];
  }
  /**
   * The "does not contain" option.
   */
  static get DOES_NOT_CONTAIN () {
    return options[4];
  }
  constructor (config) {
    if (config.name === undefined) config.name = 'Choose a text relation';
    config.options = function () {
      return options;
    };
    super(config);
  }
}
