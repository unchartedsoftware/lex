import {OptionSelection} from '../generic/option-selection';

/**
 * This state supports the entry of a String value, with possible auto-complete
 */
export class TextEntry extends OptionSelection {
  /**
   * @param {Object} config - A configuration object.
   */
  constructor (config) {
    if (config.name === undefined) config.name = 'Enter a value';
    super(config);
  }
}
