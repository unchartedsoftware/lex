import {OptionStateOption, OptionState} from '../generic/option-state';

/**
 * This state supports the selection of a relation from a list of options.
 *
 * @param {Object} config - A configuration object. Supports all of the parameters from `OptionState` and `StateTemplate`,
 *                          providing defaults for `name` and `options`. `config.options` should be a function returning
 *                          `OptionStateOption`s.
 */
export class RelationState extends OptionState {
  constructor (config) {
    if (config.name === undefined) config.name = 'Choose a relation';
    config.refreshSuggestions = function (hint) {
      return config.options().map(o => {
        return o.key.toLowerCase().indexOf(hint.toLowerCase()) === 0
          ? new OptionStateOption(o.key, o.meta, {
            shortKey: o.shortKey,
            hidden: o.hidden,
            highlighted: true
          }) : o;
      });
    };
    super(config);
  }
}
