import {ValueStateValue} from '../generic/value-state';
import {RelationState} from '../generic/relation-state';

const options = [
  ['is', '='], ['is not', '≠'], ['is like', '≅'], ['contains', '⊇'], ['does not contain', '⊉']
].map(o => new ValueStateValue(o[0], {}, {shortKey: o[1]}));

/**
 * This state supports the selection of a text relation from a list of options.
 *
 * @param {Object} config - A configuration object. Supports all of the parameters from `ValueState` and `StateTemplate`,
 *                          providing defaults for `name` and `options`.
 */
export class TextRelationState extends RelationState {
  static get IS () {
    return options[0];
  }
  static get IS_NOT () {
    return options[1];
  }
  static get IS_LIKE () {
    return options[2];
  }
  static get CONTAINS () {
    return options[3];
  }
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
