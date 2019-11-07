import { State } from '../../state';

/**
 * A non-interactive, invisible state providing a mechanism for simulating an "optionally terminal" state.
 * For example, an ValueState where certain values terminate the machine, but others do not.
 *
 * @param {object} config - A configuration object. Inherits all options from `State`.
 */
export class TerminalState extends State {
  constructor (config) {
    config.readOnly = true;
    config.defaultValue = '';
    super(config);
  }
}
