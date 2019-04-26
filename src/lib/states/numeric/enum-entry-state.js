import {ValueState, ValueStateValue} from '../generic/value-state';

const _originalSuggestions = new WeakMap();

/**
 * An EnumEntryStateValue represents an Enumeration value, with a string name and a numerical index.
 */
export class EnumEntryStateValue extends ValueStateValue {
  constructor (idx, name) {
    super(idx, {enum: name}, {});
  }
}

/**
 * This state supports the entry of an enum Value, a string associated with a number, with possible auto-complete
 * `config.enums` should be supplied as an array of `EnumEntryStateValue`s.
 * For example, the enum value `"hello"->1` would be represented as `new EnumEntryStateValue(1, 'hello')`.
 *
 * @param {Object} config - A configuration object. Supports most of the parameters from `ValueState` and `StateTemplate`,
 *                          providing defaults for `name`. `allowUnknown` is and must be false.
 *                          Possible Enumeration values must be fixed and provided via `config.enums`;
 *                          `config.fetchSuggestions`and `config.suggestions` are not supported.
 */
export class EnumEntryState extends ValueState {
  constructor (config) {
    if (config.fetchSuggestions !== undefined) {
      throw new Error('EnumEntryState does not support fetchSuggestions. Possible Enumeration values must be fixed and provided via config.enums.');
    }
    if (config.suggestions !== undefined) {
      throw new Error('EnumEntryState does not support suggestions. Possible Enumeration values must be fixed and provided via config.enums.');
    }
    if (!Array.isArray(config.enums)) {
      throw new Error('config.enums must be an Array of EnumEntryStateValues.');
    }
    if (config.name === undefined) config.name = 'Enter a value';
    config.allowUnknown = false;
    config.suggestions = config.enums;
    super(config);
    _originalSuggestions.set(this, config.suggestions);
    config.fetchSuggestions = function (hint) {
      return _originalSuggestions.get(this).map(s => {
        return new ValueStateValue(s.key, s.meta, {
          highlighted: s.key === hint
        });
      });
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
