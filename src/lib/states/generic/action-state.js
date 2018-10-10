import { State } from '../../state';

const _label = new WeakMap();
const _onClick = new WeakMap();

/**
 * A interactive state providing a mechanism to add actions to a builder
 *
 * By default, this state (and any extending classes) can be visually represented by `ActionBuilder`.
 *
 * @param {Object} config - A configuration object. Inherits all options from `StateTemplate`, and adds the following:
 * @param {string} config.label - The label to display.
 * @param {Function} config.onClick - The click handle to handle the action
 */
export class ActionState extends State {
  constructor (config) {
    super(config);
    _label.set(this, config.label || 'Default Action');
    _onClick.set(this, config.onClick);
  }

  get onClick () {
    return _onClick.get(this);
  }

  get label () {
    return _label.get(this);
  }
}
