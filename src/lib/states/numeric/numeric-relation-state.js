import {ValueStateValue} from '../generic/value-state';
import {RelationState} from '../generic/relation-state';

const options = [
  ['equals', '='], ['does not equal', '≠'], ['less than', '<'], ['greater than', '>'], ['between', 'between']
].map(o => new ValueStateValue(o[0], {}, {displayKey: o[1]}));

/**
 * This state supports the selection of a numeric relation from a list of options.
 *
 * @param {object} config - A configuration object. Supports all of the parameters from `ValueState` and `StateTemplate`,
 *                          providing defaults for `name` and `options`.
 */
export class NumericRelationState extends RelationState {
  /**
   * The "equals" option.
   */
  static get EQUALS () {
    return options[0];
  }
  /**
   * The "does not equal" option.
   */
  static get DOES_NOT_EQUAL () {
    return options[1];
  }
  /**
   * The "less than" option.
   */
  static get LESS_THAN () {
    return options[2];
  }
  /**
   * The "greater than" option.
   */
  static get GREATER_THAN () {
    return options[3];
  }
  /**
   * The "between" option.
   */
  static get BETWEEN () {
    return options[4];
  }
  constructor (config) {
    if (config.name === undefined) config.name = 'Choose a numeric relation';
    config.options = function () {
      return options;
    };
    super(config);
  }
}
