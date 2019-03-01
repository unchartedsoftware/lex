import {ValueStateValue} from '../generic/value-state';
import {RelationState} from '../generic/relation-state';

const options = [
  ['equals', '='], ['does not equal', '≠'], ['before', '<'], ['after', '>'], ['between', 'between']
].map(o => new ValueStateValue(o[0], {}, {shortKey: o[1]}));

/**
 * This state supports the selection of a datetime relation from a list of options.
 *
 * @param {Object} config - A configuration object. Supports all of the parameters from `ValueState` and `StateTemplate`,
 *                          providing defaults for `name` and `options`.
 */
export class DateTimeRelationState extends RelationState {
  static get EQUALS () {
    return options[0];
  }
  static get DOES_NOT_EQUAL () {
    return options[1];
  }
  static get BEFORE () {
    return options[2];
  }
  static get AFTER () {
    return options[3];
  }
  static get BETWEEN () {
    return options[4];
  }
  constructor (config) {
    if (config.name === undefined) config.name = 'Choose a date/time relation';
    config.options = function () {
      return options;
    };
    super(config);
  }
}
