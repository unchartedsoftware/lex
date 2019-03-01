import { State } from '../../state';

const _key = new WeakMap();
const _meta = new WeakMap();

/**
 * A rich value, which might be an object (such as a Date) or a basic type, along with associated metadata.
 *
 * @param {string} key - A string representation for this value. If two ValueStateValues are equal, their keys are equal (so they keys should be unique).
 * @param {any} meta - Whatever you want.
 */
export class ValueStateValue {
  constructor (key, meta) {
    _key.set(this, key);
    _meta.set(this, meta);
  }

  /**
   * @returns {string} The string representation for this value.
   */
  get key () { return _key.get(this); }

  /**
   * @returns {any} The metadata associated with this value.
   */
  get meta () { return _meta.get(this); }
}

const _suggestions = new WeakMap();
const _lastRefresh = new WeakMap();
const _lastRefreshPromise = new WeakMap();
const _fetchSuggestions = new WeakMap();
const _allowUnknown = new WeakMap();
const _onUnknownValue = new WeakMap();
const _suggestionLimit = new WeakMap();
const _units = new WeakMap();

/**
 * A state representing the selection of a value from a list of suggested values.
 * Intended to facilitate both simple cases (such as selecting from a list
 * of predefined options) and advanced ones (such as selecting from a list
 * of dynamically updating suggestions).
 *
 * By default, this state (and any extending classes) can be visually represented by `ValueBuilder` and `ValueAssistant`.
 *
 * This class is an `EventEmitter` and exposes the following events (in addition to `State`'s events):
 * - `on('fetching suggestions', () => {})` when a fetch for suggestions is triggered.
 * - `on('suggestions changed', (newSuggestions, oldSuggestions) => {})` when the internal list of suggestions changes.
 *
 * @param {Object} config - A configuration object. Inherits all options from `State`, and adds the following:
 * @param {AsyncFunction | undefined} config.fetchSuggestions - A (required) function which is utilized for fetching suggestions via a hint (what the user has typed). `async (hint, context) => ValueStateValue[]`, executing in the scope of this `ValueState`, allowing access to its instance methods.
 * @param {boolean | undefined} config.allowUnknown - Allow user to supply unknown values (i.e. not from suggestions). Defaults to false.
 * @param {Function | undefined} config.onUnknownValue - Optional hook (`(ValueStateValue) => ValueStateValue`) which, when a user enters an unknown `ValueStateValue`, allows for augmentation with things like metadata. Must return a new `ValueStateValue`, since `ValueStateValue` is immutable.
 * @param {number | undefined} config.suggestionLimit - A limit on the number of suggestions that will be shown at one time. Defaults to 5.
 * @param {string} config.units - A textual label which represents "units" for the value state, such as "(h) or (kg)"
 */
export class ValueState extends State {
  constructor (config) {
    const origValidate = config.validate;
    config.validate = (thisVal, thisArchive) => {
      // try incoming validation function before trying ours
      if (origValidate !== undefined && !origValidate(thisVal, thisArchive)) return false;
      // don't allow null values
      if (thisVal === null || thisVal === undefined) return false;
      // don't allow duplicates
      if (thisArchive.map(e => e.key === thisVal.key).reduce((l, r) => l || r, false)) return false;
      // if we allow unknown values, then return true
      if (this.allowUnknown) return true;
      // otherwise, return whether or not the entered value matches a known option or suggestion
      return this.suggestions.filter(o => o.key === thisVal.key).length === 1;
    };
    if (config.name === undefined) config.name = config.multivalue ? 'Select from the following values' : 'Choose a value';
    if (config.allowUnknown === undefined) config.allowUnknown = false;
    if (config.suggestionLimit === undefined) config.suggestionLimit = 5;
    super(config);

    _suggestions.set(this, []);
    _fetchSuggestions.set(this, async (hint = '', context = []) => {
      try {
        return config.fetchSuggestions.call(this, hint, context);
      } catch (err) {
        console.error(`Could not fetch list of suggestions for hint ${hint}.`); // eslint-disable-line no-console
        throw err;
      }
    });
    _units.set(this, config.units);
    _allowUnknown.set(this, config.allowUnknown);
    if (_allowUnknown.get(this) && typeof config.onUnknownValue === 'function') {
      _onUnknownValue.set(this, config.onUnknownValue);
    } else if (config.onUnknownValue !== undefined) {
      throw new Error(`Cannot specify config.onUnknownValue in state ${this.name} when config.allowUnknown is false.`);
    }
    _suggestionLimit.set(this, config.suggestionLimit);
  }

  /**
   * Getter for `suggestions`.
   *
   * @returns {Array[ValueStateValue]} - The list of suggestions to select from.
   */
  get suggestions () {
    return _suggestions.get(this);
  }

  /**
   * Setter for `suggestions`.
   *
   * @param {ValueStateValue[]} newSuggestions - A new set of suggestions.
   */
  set suggestions (newSuggestions) {
    if (this.suggestions !== newSuggestions) {
      const oldSuggestions = this.suggestions;
      _suggestions.set(this, newSuggestions);
      // only emit change event if the Suggestions actually changed
      let changed = oldSuggestions.length !== newSuggestions.length;
      for (let i = 0; !changed && i < oldSuggestions.length; i++) {
        changed = oldSuggestions[i].key !== newSuggestions[i].key;
      }
      if (changed) this.emit('suggestions changed', newSuggestions, oldSuggestions);
    }
  }

  archiveValue (context) {
    super.archiveValue(context);
    this.refreshSuggestions('', context);
  }

  unarchiveValue (context) {
    super.unarchiveValue(context);
    this.refreshSuggestions(this.unformatUnboxedValue(this.unboxedValue), context);
  }

  removeArchivedValue (idx, context) {
    super.removeArchivedValue(idx, context);
    this.refreshSuggestions('', context);
  }

  removeArchivedValues () {
    super.removeArchivedValues();
    this.refreshSuggestions();
  }

  /**
   * @returns {boolean} - Whether or not this value state allows the creation of unknown values.
   */
  get allowUnknown () {
    return _allowUnknown.get(this);
  }

  /**
   * @returns {number} - The limit on the number of suggestions to display.
   */
  get suggestionLimit () {
    return _suggestionLimit.get(this);
  }

  /**
   * @returns {string | undefined} - Any specified label for "units" for this state.
   */
  get units () {
    return _units.get(this);
  }

  /**
   * Transform a user-supplied value into a `key`. Override in a subclass if the
   * `typedText` is not directly usable as a `key` (i.e. to strip $ or whitespace).
   *
   * @param {string} typedText - What the user actually types/sees.
   * @param {any[]} context - The current boxed value of the containing `TokenStateMachine` (all `State`s up to and including this one).
   * @returns {string} The key of a `ValueStateValue` within this `State`. Must not return null.
   */
  unformatUnboxedValue (typedText, context = []) { // eslint-disable-line no-unused-vars
    return typedText;
  }

  /**
   * Transform a `key` of a `ValueStateValue` within this `State` into
   * `typedText` - what a user would actually see or type. Override in a subclass if the
   * `typedText`is not directly interchangable with a `key` (i.e. to add $ or whitespace).
   * TIP: Don't format values that don't "make sense". Pass them through as-is and allow validation to catch them.
   *
   * @param {string} key - The key of a `ValueStateValue` within this `State`.
   * @param {any[]} context - The current boxed value of the containing `TokenStateMachine` (all `State`s up to and including this one).
   * @returns {string} What the user actually types/sees.
   */
  formatUnboxedValue (key, context = []) { // eslint-disable-line no-unused-vars
    return key;
  }

  /**
   * Transform a key into an internal representation (ValueStateValue), where a key is the
   * transformation of a user-supplied value by unformatUnboxedValue.
   *
   * @param {string} key - The user-supplied value.
   * @returns {OptionStateOption} An `OptionStateOption` instance.
   */
  boxValue (key) {
    if (!this.allowUnknown) {
      // if allow unknown is false, then we can never box values
      throw new Error(`ValueState ${this.name} cannot accept user-supplied values, and thus cannot box values.`);
    }
    const boxed = new ValueStateValue(key, {});
    if (_onUnknownValue.has(this)) {
      return _onUnknownValue.get(this).call(this, boxed);
    } else {
      return boxed;
    }
  }

  /**
   * Transforms an internal representation of a value (ValueStateValue) into a string key, where a key is
   * the transformation of a user-supplied value by unformatUnboxedValue.
   *
   * @param {OptionStateOption} option - An `OptionStateOption` instance.
   * @returns {string} - The string value of the `OptionStateOption`'s key.
   */
  unboxValue (option) {
    if (option === undefined || option === null) return null;
    return option.key;
  }

  reset () {
    super.reset();
    _suggestions.set(this, []);
  }

  get currentFetch () {
    if (_lastRefreshPromise.has(this)) {
      return _lastRefreshPromise.get(this);
    } else {
      return Promise.resolve();
    }
  }

  /**
   * Can be called by a child class to trigger a refresh of suggestions based on a hint (what the
   * user has typed so far). Will trigger the `async` function supplied to the constructor as `config.refreshSuggestions`.
   *
   * @param {string | undefined} hint - What the user has typed, if anything, converted to a key by unformatUnboxedValue.
   * @param {Object} context - The current boxed value of the containing `TokenStateMachine` (all `State`s up to and including this one).
   * @returns {Promise} Resolves with the new list of options.
   */
  async fetchSuggestions (hint = '', context = {}) {
    if (hint === null) console.error('hint cannot be null in fetchSuggestions - perhaps unformatUnboxedValue returned null?'); // eslint-disable-line no-console
    // start lookup
    this.emit('fetching suggestions');
    _lastRefresh.set(this, hint);
    _lastRefreshPromise.set(this, _fetchSuggestions.get(this)(hint, context));
    const newSuggestions = await _lastRefreshPromise.get(this);
    if (_lastRefresh.get(this) !== hint) return; // prevent overwriting of new response by older, slower request
    _lastRefresh.delete(this);
    // If user-created values are allowed, and this is a multi-value state,
    // then add in a suggestion for what the user has typed as long as what
    // they've typed isn't identical to an existing suggestion.
    if (Array.isArray(newSuggestions) && this.allowUnknown && this.isMultivalue && hint.length > 0) {
      if (!newSuggestions.map(o => o.key === hint).reduce((l, r) => l || r, false)) {
        newSuggestions.unshift(this.boxValue(hint));
      }
    }
    // create lookup table for archive, preventing suggestions which have already been archived
    const lookup = new Map();
    this.archive.forEach(a => lookup.set(a.key));
    this.suggestions = newSuggestions.filter(o => !lookup.has(o.key)).slice(0, this.suggestionLimit);
    return this.suggestions;
  }
}