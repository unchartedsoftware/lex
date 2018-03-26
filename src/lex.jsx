// /** @jsx h */
import './style/lex.scss';
import { h, render } from 'preact';
import EventEmitter from 'wolfy87-eventemitter';
import { StateTransitionError, NoStateAssistantTypeError, NoStateBuilderTypeError } from './lib/errors';
import { StateTemplate } from './lib/state';
import { StateBuilderFactory } from './lib/state-builder-factory';
import { TransitionFactory } from './lib/transition-factory';
import { SearchBar } from './components/search-bar';
import { LabelState } from './lib/states/generic/label-state';
import { OptionStateOption, OptionState } from './lib/states/generic/option-state';
import { TextRelationState } from './lib/states/text/text-relation-state';
import { NumericRelationState } from './lib/states/numeric/numeric-relation-state';
import { DateTimeRelationState } from './lib/states/temporal/datetime-relation-state';
import { TextEntryState } from './lib/states/text/text-entry-state';
import { NumericEntryState } from './lib/states/numeric/numeric-entry-state';
import { CurrencyEntryState } from './lib/states/numeric/currency-entry-state';
import { DateTimeEntryState } from './lib/states/temporal/datetime-entry-state';
import { LabelBuilder } from './components/builders/generic/label-builder';
import { OptionBuilder } from './components/builders/generic/option-builder';
import { OptionAssistant } from './components/assistants/generic/option-assistant';
import { DateTimeEntryBuilder } from './components/builders/temporal/datetime-entry-builder';
import { DateTimeEntryAssistant } from './components/assistants/temporal/datetime-entry-assistant';
import * as KEYS from './lib/keys';

const _language = new WeakMap();
const _placeholder = new WeakMap();
const _builders = new WeakMap();
const _proxiedEvents = new WeakMap();
const _defaultValue = new WeakMap();
const _tokenXIcon = new WeakMap();
const _multivalueDelimiterKey = new WeakMap();
const _multivaluePasteDelimiter = new WeakMap();

/**
 * Lex - A micro-framework for building search bars.
 *
 * This class is an `EventEmitter` and exposes the following events:
 * - `on('token start', () => {})` when the user begins to create or edit a token.
 * - `on('token end', () => {})` when the user finishes creating or editing a token.
 * - `on('query changed', (newModel, oldModel, newUnboxedModel, oldUnboxedModel, nextTokenStarted) => {})` when query model changes.
 * - `on('suggestions changed', (newModel, oldModel, newUnboxedModel, oldUnboxedModel) => {})` when suggestion model changes.
 * - `on('validity changed', (newValidity, oldValidity) => {})` when validity of an active builder changes.
 *
 * @param {object} config - The configuration for this instance of `Lex`.
 * @param {StateTemplate} config.language - The root state of the search language this bar will support.
 * @param {string|undefined} config.placeholder - Placeholder text for the search bar (optional).
 * @param {string[]} config.proxiedEvents - A list of keydown events to proxy from `Builder`s to `Assistant`s. If the active `Builder` does not consume said event, it will be sent to the active `Assistant` (if any). `['ArrowUp', 'ArrowDown', 'Tab', 'Enter']` by default.
 * @param {Object[]} config.defaultQuery - The default search state for this search box. Can either be an array of arrays of boxed or unboxed (basic type) values.
 * @param {string} config.tokenXIcon - The default X icon for tokens (DOM string).
 * @param {number} config.multivalueDelimiterKey - The JS key code of the delimiter which will notionally 'separate' multiple values in any visual representation of a multivalue state. 188 (Comma) by default.
 * @param {string[]} config.multivaluePasteDelimiter - The characters which are supported as delimiters text which is pasted into a multivalue state. ',' by default.
 * @example
 * // Instantiate a new instance of lex and bind it to the page.
 * const lex = new Lex(language);
 * lex.render(document.getElementById('lex-container'));
 * @example
 * // Override default builder/assistant associations
 * const lex = new Lex(language);
 * lex.registerBuilder(OptionState, MyCustomOptionBuilder);
 */
class Lex extends EventEmitter {
  constructor (config) {
    const {
      language,
      placeholder,
      proxiedEvents = [KEYS.UP_ARROW, KEYS.DOWN_ARROW, KEYS.TAB, KEYS.ENTER],
      defaultQuery = [],
      tokenXIcon = '&times;',
      multivalueDelimiterKey = KEYS.COMMA,
      multivaluePasteDelimiter = ','
    } = config;
    super();
    // TODO throw if language is not instanceof StateTemplate
    if (language.root.isBindOnly) throw new Error('Root StateTemplate of language cannot be bind-only.');
    _language.set(this, language.root);
    _placeholder.set(this, placeholder);
    _builders.set(this, new StateBuilderFactory());
    _defaultValue.set(this, defaultQuery);
    _builders.get(this).registerBuilder(OptionState, OptionBuilder)
      .registerBuilder(DateTimeEntryState, DateTimeEntryBuilder)
      .registerBuilder(LabelState, LabelBuilder)
      .registerAssistant(OptionState, OptionAssistant)
      .registerAssistant(DateTimeEntryState, DateTimeEntryAssistant);
    _proxiedEvents.set(this, new Map());
    _tokenXIcon.set(this, tokenXIcon);
    _multivalueDelimiterKey.set(this, multivalueDelimiterKey);
    _multivaluePasteDelimiter.set(this, multivaluePasteDelimiter);
    // ensure that the multivalueDelimiter is proxied to assistants
    if (proxiedEvents.indexOf(multivalueDelimiterKey) < 0) {
      proxiedEvents.push(multivalueDelimiterKey);
    }
    proxiedEvents.forEach(e => _proxiedEvents.get(this).set(e, true));
  }

  /**
   * Register a new component as the "builder" for a certain `StateTemplate` type.
   *
   * @param {StateTemplate} templateClass - A class extending `StateTemplate`.
   * @param {Component} builderClass - A class extending `Component`, which can supply values to a `State` created from the `StateTemplate`.
   * @returns {Lex} A reference to `this` for chaining.
   */
  registerBuilder (templateClass, builderClass) {
    _builders.get(this).registerBuilder(templateClass, builderClass);
    return this;
  }

  /**
   * Register a new component as the "assistant" for a certain `StateTemplate` type.
   *
   * @param {StateTemplate} templateClass - A class extending `StateTemplate`.
   * @param {Component} assistantClass - A class extending `Component`, which can supply values to a `State` created from the `StateTemplate`.
   * @returns {Lex} A reference to `this` for chaining.
   */
  registerAssistant (templateClass, assistantClass) {
    _builders.get(this).registerAssistant(templateClass, assistantClass);
    return this;
  }

  /**
   * Define a new search language.
   *
   * @param {string} vkey - The (optional) unique key used to store this state's value within a `Token` output object. If not supplied, this state won't be represented in the `Token` value.
   * @param {StateTemplate} StateTemplateClass - The root state - must be a class which extends `StateTemplate`.
   * @param {Object} config - Construction parameters for the root `StateTemplate` class.
   * @returns {StateTemplate} A reference to the new root `State`, for chaining purposes to `.addChild()`.
   * @example
   * import { Lex } from 'lex';
   * Lex.from('field', OptionState, {
   *   name: 'Choose a field to search',
   *   options:[
   *     new OptionStateOption('Name', {type: 'string'}),
   *     new OptionStateOption('Income', {type: 'number'})
   *   ]
   * }).to(...).to(...) // to() has the same signature as from()
   */
  static from (vkey, StateTemplateClass, config = {}) {
    // vkey is optional, so we have to jump through some hoops
    let Klass = StateTemplateClass;
    let confObj = config;
    if (typeof vkey === 'string') {
      confObj.vkey = vkey;
    } else {
      Klass = vkey;
      confObj = StateTemplateClass;
    }
    return new Klass(confObj);
  }

  /**
   * Renders this instance of Lex to the DOM at a particular node.
   *
   * @param {HTMLElement} target - The target DOM node.
   */
  render (target) {
    this.target = target;
    while (target.firstChild) {
      target.removeChild(target.firstChild);
    }
    this.root = render((
      <SearchBar
        placeholder={_placeholder.get(this)}
        value={_defaultValue.get(this)}
        builders={_builders.get(this)}
        machineTemplate={_language.get(this)}
        proxiedEvents={_proxiedEvents.get(this)}
        tokenXIcon={_tokenXIcon.get(this)}
        multivalueDelimiter={_multivalueDelimiterKey.get(this)}
        multivaluePasteDelimiter={_multivaluePasteDelimiter.get(this)}
        onQueryChanged={(...args) => this.emit('query changed', ...args)}
        onSuggestionsChanged={(...args) => this.emit('suggestions changed', ...args)}
        onValidityChanged={(...args) => this.emit('validity changed', ...args)}
        onStartToken={() => this.emit('token start')}
        onEndToken={() => this.emit('token end')}
        ref={(a) => { this.searchBar = a; }}
      />
    ), target, this.root);
  }

  /**
   * Unmounts this instance of Lex from the DOM.
   */
  unmount () {
    if (this.target && this.root) {
      render('', this.target, this.root);
      delete this.target;
      delete this.root;
    }
  }

  /**
   * Completely reset the search state.
   */
  reset () {
    if (this.searchBar) {
      this.searchBar.setValue(_defaultValue.get(this));
    }
  }

  /**
   * Suggestion tokens.
   *
   * @param {Object[]} suggestions - One or more token values (an array of objects of boxed or unboxed values) to display as "suggestions" in the search bar. Will have different styling than a traditional token, and offer the user an "ADD" button they can use to lock the preview token into their query.
   * @returns {Promise} Resolves when the attempt to rewrite the query is finished. This is `async` due to the fact that `State`s such as `OptionState`s might retrieve their options asynchronously.
   */
  async setSuggestions (suggestions) {
    if (this.searchBar) {
      return this.searchBar.setSuggestions(suggestions);
    }
  }

  /**
   * Focus the search box, and the active builder (if there is one).
   */
  focus () {
    if (this.searchBar) {
      this.searchBar.focus();
    }
  }

  /**
   * Rewrite the query.
   *
   * @param {Object[]} query - One or more token values (an array of objects of boxed or unboxed values) to display to overwrite the current query with.
   * @returns {Promise} Resolves when the attempt to rewrite the query is finished. This is `async` due to the fact that `State`s such as `OptionState`s might retrieve their options asynchronously.
   */
  async setQuery (query) {
    if (this.searchBar) {
      return this.searchBar.setValue(query);
    }
  }
}

export {
  Lex,
  // errors
  StateTransitionError,
  NoStateAssistantTypeError,
  NoStateBuilderTypeError,
  // base classes
  StateTemplate,
  TransitionFactory,
  // states
  LabelState,
  OptionState,
  OptionStateOption,
  TextRelationState,
  NumericRelationState,
  DateTimeRelationState,
  TextEntryState,
  CurrencyEntryState,
  NumericEntryState,
  DateTimeEntryState,
  // UI components
  OptionBuilder,
  OptionAssistant,
  DateTimeEntryBuilder,
  DateTimeEntryAssistant,
  // Constants
  KEYS
};
