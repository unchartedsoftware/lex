const _tokenPatterns = new WeakMap();

/**
 * `TokenSuggestionFactory` attempts to map arbitrary text
 * a user has typed to a preregistered, recognizable pattern
 * which corresponds to a specific `TokenStateMachine` value.
 * Patterns are tested in registration order.
 */
export class TokenSuggestionFactory {
  constructor () {
    _tokenPatterns.set(this, []);
  }

  /**
   * Register a token pattern which, when matched, calls `factory` with the match
   * so that a `TokenStateMachine` value can be produced. Patterns are tested in
   * registration order.
   *
   * @param {RegExp} regex - A regular expression which may match what the user types.
   * @param {Function} factory - A function which, receiving the match, returns a `TokenStateMachine` boxedValue.
   */
  registerTokenPattern (regex, factory) {
    _tokenPatterns.get(this).push({pattern: regex, factory: factory.bind(Object.create(null))});
  }

  /**
   * Suggest `TokenStateMachine` values for a given user-typed string.
   *
   * @param {string} typedText - The user-supplied text.
   * @param {number} maxSuggestions - The maximum number of suggestions to return.
   * @returns {[]Object} - An array of potential boxed values to suggest to the user.
   */
  suggestTokens (typedText, maxSuggestions) {
    const patterns = _tokenPatterns.get(this);
    const suggestions = [];
    for (let i = 0; i < patterns.length && suggestions.length <= maxSuggestions; i++) {
      const match = patterns[i].pattern.exec(typedText);
      if (match !== null) {
        suggestions.push(patterns[i].factory(match));
      }
    }
    return suggestions;
  }
}
