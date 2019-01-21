import {OptionStateOption} from '../generic/option-state';
import {RelationState} from '../generic/relation-state';

/**
 * This state supports the selection of a text relation from a list of options.
 *
 * @param {Object} config - A configuration object. Supports all of the parameters from `OptionState` and `StateTemplate`,
 *                          providing defaults for `name` and `options`.
 */
export class TextRelationState extends RelationState {
  constructor (config) {
    if (config.name === undefined) config.name = 'Choose a text relation';
    config.options = function () {
      return [
        ['is', '='], ['is not', '≠'], ['is like', '≅'], ['contains', '⊇'], ['does not contain', '⊉']
      ].map(o => new OptionStateOption(o[0], {}, {shortKey: o[1]}));
    };
    super(config);
  }
}
