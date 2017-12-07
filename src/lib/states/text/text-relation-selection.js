import {Option, OptionSelection} from '../generic/option-selection';

/**
 * This state supports the selection of a text relation from a list of options.
 */
export class TextRelationSelection extends OptionSelection {
  /**
   * @param {Object} config - A configuration object.
   */
  constructor (config) {
    if (config.name === undefined) config.name = 'Choose a text relation';
    if (config.options === undefined) config.options = ['is', 'is like', 'contains'].map(o => new Option(o));
    super(config);
  }
}
