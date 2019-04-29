import {ValueStateValue, ValueState} from '../generic/value-state';

/**
 * This state supports the selection of a relation from a list of options.
 *
 * @param {Object} config - A configuration object. Supports all of the parameters from `ValueState` and `StateTemplate`,
 *                          providing defaults for `name` and `options`. `config.options` should be a function returning
 *                          `ValueStateValue`s.
 */
export class RelationState extends ValueState {
  constructor (config) {
    if (config.name === undefined) config.name = 'Choose a relation';
    config.fetchSuggestions = function (hint) {
      return config.options().map(o => {
        return new ValueStateValue(o.key, o.meta, {
          displayKey: o.displayKey,
          hidden: o.hidden,
          highlighted: o.key.toLowerCase().indexOf(hint.toLowerCase()) === 0
        });
      });
    };
    super(config);
  }
}
