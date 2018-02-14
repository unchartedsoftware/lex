import {OptionStateOption, OptionState} from '../generic/option-state';

/**
 * This state supports the selection of a datetime relation from a list of options.
 *
 * @param {Object} config - A configuration object. Supports all of the parameters from `OptionState` and `StateTemplate`,
 *                          providing defaults for `name` and `options`.
 */
export class DateTimeRelationState extends OptionState {
  constructor (config) {
    if (config.name === undefined) config.name = 'Choose a date/time relation';
    if (config.options === undefined) {
      config.options = [
        ['equals', '='], ['does not equal', '≠'], ['before', '<'], ['after', '>'], ['between', 'between']
      ].map(o => new OptionStateOption(o[0], {}, {shortKey: o[1]}));
    }
    super(config);
  }
}
