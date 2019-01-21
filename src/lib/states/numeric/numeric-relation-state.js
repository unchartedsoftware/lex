import {OptionStateOption} from '../generic/option-state';
import {RelationState} from '../generic/relation-state';

/**
 * This state supports the selection of a numeric relation from a list of options.
 *
 * @param {Object} config - A configuration object. Supports all of the parameters from `OptionState` and `StateTemplate`,
 *                          providing defaults for `name` and `options`.
 */
export class NumericRelationState extends RelationState {
  constructor (config) {
    if (config.name === undefined) config.name = 'Choose a numeric relation';
    config.options = function () {
      return [
        ['equals', '='], ['does not equal', '≠'], ['less than', '<'], ['greater than', '>'], ['between', 'between']
      ].map(o => new OptionStateOption(o[0], {}, {shortKey: o[1]}));
    };
    super(config);
  }
}
