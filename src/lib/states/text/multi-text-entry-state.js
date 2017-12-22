import {MultiOptionState} from '../generic/multi-option-state';

/**
 * This state supports the entry of mutiple String values, with possible auto-complete.
 *
 * @param {Object} config - A configuration object. Supports all of the parameters from `OptionState` and `StateTemplate`,
 *                          providing defaults for `name`, `validate` (always valid) and `allowUnknown` (true).
 */
export class MultiTextEntryState extends MultiOptionState {
  /**
   * @param {Object} config - A configuration object.
   */
  constructor (config) {
    if (config.name === undefined) config.name = 'Enter multiple values, separated by ,';
    if (config.validate === undefined) config.validate = () => true;
    config.allowUnknown = true;
    super(config);
  }
}
