import { State } from '../../state';

const _label = new WeakMap();

/**
 * A non-interactive state providing a mechanism to add a textual label between two other builders.
 *
 * By default, this state (and any extending classes) can be visually represented by `LabelBuilder`.
 *
 * @param {object} config - A configuration object. Inherits all options from `StateTemplate`, and adds additional elements.
 * @param {string} config.label - The label to display. Will also be used as the (fixed) value.
 */
export class LabelState extends State {
  constructor (config) {
    config.readOnly = true;
    config.defaultValue = config.label;
    super(config);
    _label.set(this, config.label);
  }
}
