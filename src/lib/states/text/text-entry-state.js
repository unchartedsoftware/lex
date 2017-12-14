import {OptionState} from '../generic/option-state';

/**
 * This state supports the entry of a String value, with possible auto-complete.
 *
 * @param {Object} config - A configuration object. Supports all of the parameters from `OptionState` and `StateTemplate`,
 *                          providing defaults for `name`, `validationFunction` (always valid) and `allowUnknown` (true).
 */
export class TextEntryState extends OptionState {
  /**
   * @param {Object} config - A configuration object.
   */
  constructor (config) {
    if (config.name === undefined) config.name = 'Enter a value';
    if (config.validationFunction === undefined) config.validationFunction = () => true;
    config.allowUnknown = true;
    super(config);
  }
}
