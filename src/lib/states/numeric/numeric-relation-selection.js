import {Option, OptionSelection} from '../generic/option-selection';

/**
 * This state supports the selection of a numeric relation from a list of options.
 *
 * @param {Object} config - A configuration object. Supports all of the parameters from `OptionSelection` and `StateTemplate`,
 *                          providing defaults for `name` and `options`.
 */
export class NumericRelationSelection extends OptionSelection {
  constructor (config) {
    if (config.name === undefined) config.name = 'Choose a numeric relation';
    if (config.options === undefined) config.options = ['less than', 'greater than', 'equals', 'between'].map(o => new Option(o));
    super(config);
  }
}
