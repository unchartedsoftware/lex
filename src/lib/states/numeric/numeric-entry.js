import {OptionSelection} from '../generic/option-selection';

/**
 * This state supports the entry of a Number value, with possible auto-complete
 */
export class NumericEntry extends OptionSelection {
  /**
   * @param {Object} config - A configuration object.
   */
  constructor (config) {
    if (config.name === undefined) config.name = 'Enter a value';
    if (config.validationFunction === undefined) {
      config.validationFunction = (val) => {
        return !isNaN(val.key);
      };
    }
    config.allowUnknown = true;
    super(config);
  }
}
