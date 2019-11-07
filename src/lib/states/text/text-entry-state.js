import {ValueState} from '../generic/value-state';

/**
 * This state supports the entry of a String value, with possible auto-complete.
 *
 * @param {object} config - A configuration object. Supports all of the parameters from `ValueState` and `StateTemplate`,
 *                          providing defaults for `name`, `validate` and `allowUnknown` (true).
 */
export class TextEntryState extends ValueState {
  /**
   * @param {object} config - A configuration object.
   */
  constructor (config) {
    if (config.name === undefined) {
      config.name = !config.multivalue ? 'Enter a value' : 'Enter values';
    }
    if (config.validate === undefined) {
      config.validate = (val) => {
        return val && typeof val.key === 'string' && val.key.length > 0;
      };
    }
    config.allowUnknown = true;
    super(config);
  }
}
