import { StateTemplate } from '../../state';

/**
 * A non-interactive, invisible state providing a mechanism for simulating an "optionally terminaly" state.
 * For example, an OptionState where certain options terminate the machine, but others do not.
 *
 * @param {Object} config - A configuration object. Inherits all options from `StateTemplate`.
 */
export class TerminalState extends StateTemplate {
  constructor (config) {
    config.readOnly = true;
    config.defaultValue = '';
    super(config);
  }
}
