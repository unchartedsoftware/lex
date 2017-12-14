import {OptionState} from '../generic/option-selection';

/**
 * This state supports the entry of a Number value, with possible auto-complete
 *
 * @param {Object} config - A configuration object. Supports all of the parameters from `OptionState` and `StateTemplate`,
 *                          providing defaults for `name`, `validationFunction` (valid iff `!isNaN`) and `allowUnknown` (true).
 */
export class NumericEntry extends OptionState {
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
