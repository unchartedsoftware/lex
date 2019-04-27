import {ValueState, ValueStateValue} from '../generic/value-state';

const _tokenSuggestions = new WeakMap();

/**
 * An TokenSuggestionStateValue represents an TokenSuggestionState value,
 * with regexp pattern(s) and a function producing a full Token value
 * which would be suggested if a regexp is matched.
 *
 * @param {[]RegExp} regexArr - An array of regular expressions which may match what the user types.
 * @param {Function} description - A function which, receiving the match, returns the text to show a user describing this suggestion.
 * @param {Function} factory - A function which, receiving the match, returns a `TokenStateMachine` boxedValue.
 */
export class TokenSuggestionStateValue extends ValueStateValue {
  constructor (regexArr, description, factory) {
    super(regexArr, {description: description, pattern: regexArr, factory: factory}, {});
  }
}

/**
 * This state supports the suggestion of entire token values, with possible auto-complete
 *
 * @param {Object} config - A configuration object. Supports all of the parameters from
 *                          `ValueState` and `StateTemplate`, providing defaults for `name`,
 *                          `validate` and `allowUnknown` (false). `suggestions` and `fetchSuggestions`
 *                          are not supported, and are supplanted by `config.tokenSuggestions`.
 * @param {[]TokenSuggestionStateValue} tokenSuggestions - An array of suggestions for full token values.
 */
export class TokenSuggestionState extends ValueState {
  constructor (config) {
    if (config.fetchSuggestions !== undefined) {
      throw new Error('TokenSuggestionState does not support fetchSuggestions. Possible token suggestions must be fixed and provided via config.tokenSuggestions.');
    }
    if (config.suggestions !== undefined) {
      throw new Error('TokenSuggestionState does not support suggestions. Possible token suggestion values must be fixed and provided via config.tokenSuggestions.');
    }
    if (!Array.isArray(config.tokenSuggestions)) {
      throw new Error('config.tokenSuggestions must be an Array of TokenSuggestionStateValue.');
    }
    if (config.name === undefined) config.name = 'Type to see search suggestions';
    config.allowUnknown = false;
    config.hideLifecycleInteractions = true;
    config.suggestions = config.tokenSuggestions;
    config.overrideValidation = true;
    const origValidate = config.validate;
    config.validate = (thisVal, thisArchive) => {
      if (thisVal instanceof Error) return false;
      // try incoming validation function before trying ours
      if (origValidate !== undefined && !origValidate(thisVal, thisArchive)) return false;
      // otherwise, return true
      return true;
    };
    super(config);
    _tokenSuggestions.set(this, config.tokenSuggestions);
    config.fetchSuggestions = function (hint) {
      return _tokenSuggestions.get(this).map(s => {
        for (const p of s.meta.pattern) {
          const match = p.test(hint);
          if (match) return [s, p];
        }
        return false;
      }).filter(m => m).map(([s, p]) => {
        const match = p.exec(hint);
        return new ValueStateValue(s.meta.description(match), {...s.meta, match: match}, {
          highlighted: true
        });
      });
    };
  }
}
