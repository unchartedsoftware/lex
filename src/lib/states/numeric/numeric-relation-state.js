import {OptionStateOption, OptionState} from '../generic/option-state';

/**
 * This state supports the selection of a numeric relation from a list of options.
 *
 * @param {Object} config - A configuration object. Supports all of the parameters from `OptionState` and `StateTemplate`,
 *                          providing defaults for `name` and `options`.
 */
export class NumericRelationState extends OptionState {
  constructor (config) {
    if (config.name === undefined) config.name = 'Choose a numeric relation';
    if (config.options === undefined) {
      config.options = [
        ['equals', '='], ['does not equal', '≠'], ['less than', '<'], ['greater than', '>'], ['between', 'between']
      ].map(o => new OptionStateOption(o[0], {}, o[1]));
    }
    super(config);
  }
}
