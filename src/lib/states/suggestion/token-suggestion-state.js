import {ValueState, ValueStateValue} from '../generic/value-state';

const _tokenSuggestions = new WeakMap();

/**
 * An TokenSuggestionStateValue represents an TokenSuggestionState value,
 * with a regexp pattern and a function producing a full Token value
 * which would be suggested if the regexp is matched.
 *
 * @param {RegExp} regex - A regular expression which may match what the user types.
 * @param {string} description - Text to show a user describing this suggestion.
 * @param {Function} factory - A function which, receiving the match, returns a `TokenStateMachine` boxedValue.
 */
export class TokenSuggestionStateValue extends ValueStateValue {
  constructor (regex, description, factory) {
    super(description, {pattern: regex, factory: factory}, {});
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
    if (config.name === undefined) config.name = 'Enter a value';
    config.allowUnknown = false;
    config.suggestions = config.tokenSuggestions;
    super(config);
    _tokenSuggestions.set(this, config.tokenSuggestions);
    config.fetchSuggestions = function (hint) {
      return _tokenSuggestions.get(this).filter(s => s.meta.pattern.test(hint)).map(s => {
        return new ValueStateValue(s.key, {...s.meta, match: s.meta.pattern.exec(hint)}, {
          highlighted: true
        });
      });
    };
  }
}
