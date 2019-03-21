import {ValueState} from '../generic/value-state';

const _originalSuggestions = new WeakMap();

/**
 * This state supports the entry of an enum Value, a string associated with a number, with possible auto-complete
 * `config.suggestions` should be supplied as an array of `ValueStateValue`s which indicate the associated number value
 * in their metadata. For example, the enum value `"hello"->1` would be represented as `new ValueStateValue('hello', {enum: 1})`.
 *
 * @param {Object} config - A configuration object. Supports most of the parameters from `ValueState` and `StateTemplate`,
 *                          providing defaults for `name`. `allowUnknown` is and must be false.
 *                          Suggestions must be fixed and provided via `config.suggestions`; `config.fetchSuggestions` is not supported.
 */
export class EnumEntryState extends ValueState {
  constructor (config) {
    if (config.fetchSuggestions !== undefined) {
      throw new Error('EnumEntryState does not support fetchSuggestions. Suggestions must be fixed and provided via config.sugggestions.');
    }
    if (config.name === undefined) config.name = 'Enter a value';
    config.allowUnknown = false;
    super(config);
    _originalSuggestions.set(this, config.suggestions);
    config.fetchSuggestions = function (hint) {
      if (hint.length === 0) {
        return _originalSuggestions.get(this);
      }
      return _originalSuggestions.get(this).filter(o => o.key === hint);
    };
  }

  unformatUnboxedValue (displayKey) {
    if (displayKey === undefined && displayKey === null) return null;
    if (displayKey.length === 0) return '';
    const match = _originalSuggestions.get(this).filter(s => s.meta.enum.indexOf(displayKey) > -1);
    if (match.length === 0) {
      return '';
    }
    return match[0].key;
  }

  formatUnboxedValue (key) {
    // don't format things that don't make sense
    if (key === undefined || key === null) return null;
    const match = _originalSuggestions.get(this).filter(s => s.key === key);
    if (match.length === 0) {
      throw new Error('Unable to translate enum value into text.');
    }
    return match[0].meta.enum;
  }
}
