import {OptionStateOption, OptionState} from '../generic/option-state';

/**
 * This state supports the selection of a text relation from a list of options.
 *
 * @param {Object} config - A configuration object. Supports all of the parameters from `OptionState` and `StateTemplate`,
 *                          providing defaults for `name` and `options`.
 */
export class TextRelationState extends OptionState {
  constructor (config) {
    if (config.name === undefined) config.name = 'Choose a text relation';
    if (config.options === undefined) config.options = ['is', 'is like', 'contains'].map(o => new OptionStateOption(o));
    super(config);
  }
}
