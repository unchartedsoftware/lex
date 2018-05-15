import { State } from '../../state';

const _key = new WeakMap();
const _shortKey = new WeakMap();
const _meta = new WeakMap();
const _hidden = new WeakMap();

/**
 * An option within a list of options
 *
 * @param {string} key - A label for this option. Should be unique within the list of options.
 * @param {any} meta - Whatever you want.
 * @param {object} config - Additional configuration for this `OptionStateOption`.
 * @param {boolean} config.hidden - If true, this `OptionStateOption` will never be suggested to the user.
 * @param {string|undefined} config.shortKey - A shorter representation of `key` displayed in read-only mode. Optional.
 */
export class OptionStateOption {
  constructor (key, meta, config = {}) {
    _key.set(this, key);
    _meta.set(this, meta);
    _shortKey.set(this, config.shortKey);
    _hidden.set(this, config.hidden && true);
  }

  /**
   * @returns {string} The label for this option.
   */
  get key () { return _key.get(this); }

  /**
   * @returns {string} The abbreviated label for this option.
   */
  get shortKey () { return _shortKey.get(this); }

  /**
   * @returns {boolean} Whether or not this option should be hidden from suggestions.
   */
  get hidden () { return _hidden.get(this); }

  /**
   * @returns {any} The metadata associated with this option.
   */
  get meta () { return _meta.get(this); }
}

const _initialOptions = new WeakMap();
const _options = new WeakMap();
const _suggestions = new WeakMap();
const _refreshSuggestions = new WeakMap();
const _fetchOptions = new WeakMap();
const _lastRefresh = new WeakMap();
const _allowUnknown = new WeakMap();
const _onUnknownOption = new WeakMap();
const _units = new WeakMap();
const _suggestionLimit = new WeakMap();

/**
 * A state representing the selection of an option from a list of options.
 * Intended to facilitate both simple cases (such as selecting from a list
 * of predefined options) and advanced ones (such as selecting from a list
 * of dynamically updating suggestions).
 *
 * By default, this state (and any extending classes) can be visually represented by `OptionBuilder` and `OptionAssistant`.
 *
 * This class is an `EventEmitter` and exposes the following events (in addition to `State`'s events):
 * - `on('options changed', (newOptions, oldOptions) => {})` when the internal list of options changes.
 * - `on('suggestions changed', (newOptions, oldOptions) => {})` when the internal list of suggestions changes.
 *
 * @param {Object} config - A configuration object. Inherits all options from `State`, and adds the following:
 * @param {OptionStateOption[] | AsyncFunction} config.options - The list of options to select from, or an `async` function that efficiently fetches a specific list of `OptionStateOption`s for validation purposes. (`async (unformattedUnboxedValues, context) => OptionStateOption[]`), executing in the scope of this `OptionState`, allowing access to its instance methods.
 * @param {AsyncFunction | undefined} config.refreshSuggestions - An optional function which can be supplied as a mechanism for fetching suggestions via a hint (required if config.options is not an array). `async (hint, context) => OptionStateOption[]`, executing in the scope of this `OptionState`, allowing access to its instance methods.
 * @param {boolean | undefined} config.allowUnknown - Allow user to enter unknown options by entering custom values. Defaults to false.
 * @param {Function | undefined} config.onUnknownOption - Optional hook (`(OptionStateOption) => OptionStateOption`) which, when a user enters an unknown `OptionStateOption`, allows for augmentation with things like metadata. Must return a new `OptionStateOption`, since `OptionStateOption` is immutable.
 * @param {number | undefined} config.suggestionLimit - A limit on the number of options that will be shown at one time. Defaults to 10.
 * @param {string} config.units - A textual label which represents "units" for the option state (will display to the right of the builder)
 */
export class OptionState extends State {
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
      return this.options.filter(o => o.key === thisVal.key).length === 1 || this.suggestions.filter(o => o.key === thisVal.key).length === 1;
    };
    if (config.name === undefined) config.name = config.multivalue ? 'Select from the following options' : 'Choose an option';
    if (config.options === undefined) config.options = [];
    if (config.allowUnknown === undefined) config.allowUnknown = false;
    if (config.suggestionLimit === undefined) config.suggestionLimit = 10;
    super(config);

    _suggestions.set(this, []);
    _options.set(this, []);
    // if config.options is an array, then we have a predefined set of options
    if (Array.isArray(config.options)) {
      _initialOptions.set(this, config.options);
      _refreshSuggestions.set(this, (hint = '') => {
        return _initialOptions.get(this).filter(o => o.key.toLowerCase().indexOf(hint.toLowerCase()) === 0);
      });
      _fetchOptions.set(this, (unformattedUnboxedValues = []) => {
        const lookup = new Map();
        unformattedUnboxedValues.forEach(v => lookup.set(v.toLowerCase(), true));
        return _initialOptions.get(this).filter(o => {
          return lookup.has(o.key.toLowerCase());
        });
      });
    } else {
      _fetchOptions.set(this, async (unformattedUnboxedValues = [], context = []) => {
        try {
          return config.options.call(this, unformattedUnboxedValues, context);
        } catch (err) {
          console.error(`Could not fetch list of options for unboxed values ${unformattedUnboxedValues.join(',')}`); // eslint-disable-line no-console
          throw err;
        }
      });
      if (!config.refreshSuggestions) {
        throw new Error('Async options supplied to OptionState without a refreshSuggestions function (which is required in this case).');
      } else {
        _refreshSuggestions.set(this, async (hint = '', context = []) => {
          try {
            return config.refreshSuggestions.call(this, hint, context);
          } catch (err) {
            console.error(`Could not refresh list of suggestions for hint ${hint}.`); // eslint-disable-line no-console
            throw err;
          }
        });
      }
    }
    _units.set(this, config.units);
    _allowUnknown.set(this, config.allowUnknown);
    if (_allowUnknown.get(this) && typeof config.onUnknownOption === 'function') {
      _onUnknownOption.set(this, config.onUnknownOption);
    } else if (config.onUnknownOption !== undefined) {
      throw new Error(`Cannot specify config.onUnknownOption in state ${this.name} when config.allowUnknown is false.`);
    }
    _suggestionLimit.set(this, config.suggestionLimit);
  }

  /**
   * Getter for `options`.
   *
   * @returns {Array[OptionStateOption]} - The list of options to select from.
   */
  get options () {
    return _options.get(this);
  }

  /**
   * Setter for `options`.
   *
   * @param {OptionStateOption[]} newOptions - A new set of options for this selector.
   */
  set options (newOptions) {
    if (this.options !== newOptions) {
      const oldOptions = this.options;
      _options.set(this, newOptions);
      // only emit change event if the options actually changed
      let changed = oldOptions.length !== newOptions.length;
      for (let i = 0; !changed && i < oldOptions.length; i++) {
        changed = oldOptions[i].key !== newOptions[i].key;
      }
      if (changed) this.emit('options changed', newOptions, oldOptions);
    }
  }

  /**
   * Getter for `suggestions`.
   *
   * @returns {Array[OptionStateOption]} - The list of suggestions to select from.
   */
  get suggestions () {
    return _suggestions.get(this);
  }

  /**
   * Setter for `suggestions`.
   *
   * @param {OptionStateOption[]} newSuggestions - A new set of suggestions for this selector.
   */
  set suggestions (newSuggestions) {
    if (this.suggestions !== newSuggestions) {
      const oldSuggestions = this.suggestions;
      _suggestions.set(this, newSuggestions);
      // only emit change event if the options actually changed
      let changed = oldSuggestions.length !== newSuggestions.length;
      for (let i = 0; !changed && i < oldSuggestions.length; i++) {
        changed = oldSuggestions[i].key !== newSuggestions[i].key;
      }
      if (changed) this.emit('suggestions changed', newSuggestions, oldSuggestions);
    }
  }

  archiveValue (context) {
    super.archiveValue(context);
    this.options = [...this.options, this.archive[this.archive.length - 1]];
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

  /**
   * @returns {boolean} - Whether or not this option selector allows the creation of unknown options.
   */
  get allowUnknown () {
    return _allowUnknown.get(this);
  }

  /**
   * @returns {number} - The limit on the number of options to display.
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
   * `displayKey`s should be different from `key`s.
   *
   * @param {string} displayKey - What the user actually types/sees.
   * @param {any[]} context - The current boxed value of the containing `TokenStateMachine` (all `State`s up to and including this one).
   * @returns {string} The key of an `OptionStateOption` within this `State`. Must not return null.
   */
  unformatUnboxedValue (displayKey, context = []) { // eslint-disable-line no-unused-vars
    return displayKey;
  }

  /**
   * Transform a `key` of an `OptionStateOption` within this `State` into a
   * `displayKey` - what a user would actually see or type. Override in a subclass if the
   * `displayKey`s should be different from `key`s.
   * TIP: Don't format values that don't "make sense". Pass them through as-is and allow validation to catch them.
   *
   * @param {string} key - The key of an `OptionStateOption` within this `State`.
   * @param {any[]} context - The current boxed value of the containing `TokenStateMachine` (all `State`s up to and including this one).
   * @returns {string} What the user actually types/sees.
   */
  formatUnboxedValue (key, context = []) { // eslint-disable-line no-unused-vars
    return key;
  }

  /**
   * Transform a key into an internal representation, where a key is the transformation of a user-supplied
   * value by unformatUnboxedValue.
   *
   * @param {string} key - The user-supplied value.
   * @returns {OptionStateOption} An `OptionStateOption` instance.
   */
  boxValue (key) {
    const matches = [
      ...this.options.filter(o => o.key.toLowerCase() === String(key).toLowerCase()),
      ...this.suggestions.filter(o => o.key.toLowerCase() === String(key).toLowerCase())
    ];
    if (matches.length > 0) {
      return matches[0];
    } else if (this.allowUnknown) {
      if (_onUnknownOption.has(this)) {
        return _onUnknownOption.get(this).call(this, new OptionStateOption(key, {}));
      } else {
        return new OptionStateOption(key, {});
      }
    } else {
      if (!this.allowUnknown && this.options.length === 0 && this.suggestions.length === 0) throw new Error(`OptionState ${this.name} cannot accept user-supplied values, but does not have any options.`);
      return null;
    }
  }

  /**
   * Transforms an internal representation of a value into a user-supplied-style value.
   *
   * @param {OptionStateOption} option - An `OptionStateOption` instance.
   * @returns {string} - The string value of the `OptionStateOption`'s key.
   */
  unboxValue (option) {
    if (option === undefined || option === null) return null;
    return option.key;
  }

  /**
   * Perform any asynchronous operations required to initialize a `State`s instanced from this `StateTemplate`.
   *
   * @param {any[]} context - The current boxed value of the containing `TokenStateMachine` (all `State`s up to and including this one).
   * @param {string[], undefined} initialUnboxedValues - The initial unboxed values which will be bound to this `State`.
   * @returns {Promise} A `Promise` which resolves when initialize completes successfully, rejecting otherwise.
   */
  async initialize (context = {}, initialUnboxedValues = []) {
    await super.initialize();
    // fetch initial options for validiation
    this.options = await _fetchOptions.get(this)(initialUnboxedValues.map(v => this.unformatUnboxedValue(v)), context);
    // fetch initial suggestions
    await this.refreshSuggestions('', context);
    if (!this.allowUnknown && this.suggestions.length === 0) {
      throw new Error(`OptionState ${this.name} cannot accept user-supplied values, but does not have any suggestions.`);
    }
  }

  reset () {
    super.reset();
    _options.set(this, []);
    _suggestions.set(this, []);
  }

  /**
   * Can be called by a child class to trigger a refresh of suggestions based on a hint (what the
   * user has typed so far). Will trigger the `async` function supplied to the constructor as `config.refreshSuggestions`.
   *
   * @param {string | undefined} hint - What the user has typed, if anything, converted to a key by unformatUnboxedValue.
   * @param {Object} context - The current boxed value of the containing `TokenStateMachine` (all `State`s up to and including this one).
   * @returns {Promise} Resolves with the new list of options.
   */
  async refreshSuggestions (hint = '', context = {}) {
    if (hint === null) console.error('hint cannot be null in refreshOptions - perhaps unformatUnboxedValue returned null?'); // eslint-disable-line no-console
    if (_refreshSuggestions.has(this)) {
      // start lookup
      _lastRefresh.set(this, hint);
      const newSuggestions = await _refreshSuggestions.get(this)(hint, context);
      if (_lastRefresh.get(this) !== hint) return; // prevent overwriting of new response by older, slower request
      // If user-created values are allowed, and this is a multi-value state,
      // then add in an option for what the user has typed as long as what
      // they've typed isn't identical to an existing option.
      if (Array.isArray(newSuggestions) && this.allowUnknown && this.isMultivalue && hint.length > 0) {
        if (!newSuggestions.map(o => o.key === hint).reduce((l, r) => l || r, false)) {
          newSuggestions.unshift(this.boxValue(hint));
        }
      }
      // create lookup table for archive
      const lookup = new Map();
      this.archive.forEach(a => lookup.set(a.key));
      this.suggestions = newSuggestions.filter(o => !o.hidden && !lookup.has(o.key)).slice(0, this.suggestionLimit);
      return this.suggestions;
    }
  }
}
