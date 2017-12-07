import {Option, OptionSelection} from '../generic/option-selection';

/**
 * This state supports the selection of a numeric relation from a list of options.
 */
export class NumericRelationSelection extends OptionSelection {
  /**
   * @param {Object} config - A configuration object.
   */
  constructor (config) {
    if (config.name === undefined) config.name = 'Choose a numeric relation';
    if (config.options === undefined) config.options = ['less than', 'greater than', 'equals', 'between'].map(o => new Option(o));
    super(config);
  }
}
