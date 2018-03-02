import {OptionState} from '../generic/option-state';

/**
 * This state supports the entry of a String value, with possible auto-complete.
 *
 * @param {Object} config - A configuration object. Supports all of the parameters from `OptionState` and `StateTemplate`,
 *                          providing defaults for `name`, `validate` (always valid) and `allowUnknown` (true).
 */
export class TextEntryState extends OptionState {
  /**
   * @param {Object} config - A configuration object.
   */
  constructor (config) {
    if (config.name === undefined) config.name = 'Enter a value';
    if (config.validate === undefined) {
      config.validate = (val) => {
        return val && typeof val.key === 'string' && val.key.length > 0;
      };
    }
    config.allowUnknown = true;
    super(config);
  }
}
