// /** @jsx h */
import './style/lex.scss';
import { h, render } from 'preact';
import EventEmitter from 'wolfy87-eventemitter';
import { StateTransitionError, NoStateAssistantTypeError, NoStateBuilderTypeError } from './lib/errors';
import { State, StateTemplate } from './lib/state';
import { Action } from './lib/action';
import { StateBuilderFactory } from './lib/state-builder-factory';
import { TransitionFactory } from './lib/transition-factory';
import { SearchBar } from './components/search-bar';
import { LabelState } from './lib/states/generic/label-state';
import { TerminalState } from './lib/states/generic/terminal-state';
import { ValueStateValue, ValueState } from './lib/states/generic/value-state';
import { RelationState } from './lib/states/generic/relation-state';
import { TextRelationState } from './lib/states/text/text-relation-state';
import { NumericRelationState } from './lib/states/numeric/numeric-relation-state';
import { DateTimeRelationState } from './lib/states/temporal/datetime-relation-state';
import { TextEntryState } from './lib/states/text/text-entry-state';
import { NumericEntryState } from './lib/states/numeric/numeric-entry-state';
import { CurrencyEntryState } from './lib/states/numeric/currency-entry-state';
import { EnumEntryState, EnumEntryStateValue } from './lib/states/numeric/enum-entry-state';
import { DateTimeEntryState } from './lib/states/temporal/datetime-entry-state';
import { LabelBuilder } from './components/builders/generic/label-builder';
import { TerminalBuilder } from './components/builders/generic/terminal-builder';
import { ValueBuilder } from './components/builders/generic/value-builder';
import { ValueAssistant } from './components/assistants/generic/value-assistant';
import { DateTimeEntryBuilder } from './components/builders/temporal/datetime-entry-builder';
import { DateTimeEntryAssistant } from './components/assistants/temporal/datetime-entry-assistant';
import { ActionButton } from './components/action-button';
import { Builder } from './components/builder';
import { Assistant } from './components/assistant';
import * as KEYS from './lib/keys';

const _language = new WeakMap();
const _placeholder = new WeakMap();
const _popupContainer = new WeakMap();
const _builders = new WeakMap();
const _proxiedEvents = new WeakMap();
const _defaultValue = new WeakMap();
const _tokenXIcon = new WeakMap();
const _multivalueDelimiterKey = new WeakMap();
const _multivaluePasteDelimiter = new WeakMap();
const _cssClass = new WeakMap();
const _cancelOnBlur = new WeakMap();
const _displayCancelOnCreate = new WeakMap();
const _onAcceptSuggestion = new WeakMap();
const _onRejectSuggestion = new WeakMap();

/**
 * Lex - A micro-framework for building search bars.
 *
 * This class is an `EventEmitter` and exposes the following events:
 * - `on('token start', () => {})` when the user begins to create or edit a token.
 * - `on('token end', () => {})` when the user finishes creating or editing a token.
 * - `on('token action', (tokenIdx, actionVkey, newModel, newUnboxedModel, oldActionVal) => {})` when the user triggers a token action.
 * - `on('query changed', (newModel, oldModel, newUnboxedModel, oldUnboxedModel, nextTokenStarted) => {})` when query model changes.
 * - `on('suggestions changed', (newModel, oldModel, newUnboxedModel, oldUnboxedModel) => {})` when suggestion model changes.
 * - `on('validity changed', (newValidity, oldValidity) => {})` when validity of an active builder changes.
 *
 * @param {object} config - The configuration for this instance of `Lex`.
 * @param {StateTemplate} config.language - The root state of the search language this bar will support.
 * @param {string|undefined} config.placeholder - Placeholder text for the search bar (optional).
 * @param {string|DOMNode} config.container - Container for Lex popups, such as `Assistants`.
 * @param {string[]} config.proxiedEvents - A list of keydown events to proxy from `Builder`s to `Assistant`s. If the active `Builder` does not consume said event, it will be sent to the active `Assistant` (if any). `['ArrowUp', 'ArrowDown', 'Tab', 'Enter']` by default.
 * @param {Object[]} config.defaultQuery - The default search state for this search box. Can either be an array of arrays of boxed or unboxed (basic type) values.
 * @param {string} config.tokenXIcon - The default X icon for tokens (DOM string).
 * @param {number} config.multivalueDelimiterKey - The JS key code of the delimiter which will notionally 'separate' multiple values in any visual representation of a multivalue state. 188 (',') by default.
 * @param {string[]} config.multivaluePasteDelimiter - The characters which are supported as delimiters text which is pasted into a multivalue state. ',' by default.
 * @param {string[]} config.cssClass - Add unique classes to the lex search bar and associated assistant
 * @param {boolean} config.cancelOnBlur - Whether or not to cancel token creation/editing on blur. True by default.
 * @param {boolean} config.displayCancelOnCreate - Whether or not to display the cancel button when creating a new token. False by default.
 * @param {function | undefined} config.onAcceptSuggestion - A callback called when the user presses "add" on a suggestion. A no-op by default (`(s, idx) => s`) but, if supplied, can be used to transform the incoming boxed suggestion, perform additional actions, etc. Return `null` to stop Lex from updating suggestions and query automatically, or return the suggestion (or a transformed version) to allow Lex to handle the rest.
 * @param {function | undefined} config.onRejectSuggestion - A callback called when the user presses "x" on a suggestion. A no-op by default (`(s, idx) => true`) but, if supplied, can be used to perform additional actions or stop Lex from auto-updating the suggestions and query (by returning `false`)
 * @example
 * // Instantiate a new instance of lex and bind it to the page.
 * const lex = new Lex(language);
 * lex.render(document.getElementById('lex-container'));
 * @example
 * // Override default builder/assistant associations
 * const lex = new Lex(language);
 * lex.registerBuilder(ValueState, MyCustomOptionBuilder);
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
      multivaluePasteDelimiter = ',',
      cssClass = [],
      cancelOnBlur = true,
      displayCancelOnCreate = false,
      container = 'body',
      onAcceptSuggestion = (s) => s,
      onRejectSuggestion = () => true
    } = config;
    super();
    // TODO throw if language is not instanceof StateTemplate
    if (language.getInstance().root.isBindOnly) throw new Error('Root StateTemplate of language cannot be bind-only.');
    _language.set(this, language.root);
    _placeholder.set(this, placeholder);
    _popupContainer.set(this, container);
    _builders.set(this, new StateBuilderFactory());
    _defaultValue.set(this, defaultQuery);
    _builders.get(this)
      .registerBuilder(ValueState, ValueBuilder)
      .registerBuilder(DateTimeEntryState, DateTimeEntryBuilder)
      .registerBuilder(LabelState, LabelBuilder)
      .registerBuilder(TerminalState, TerminalBuilder)
      .registerAssistant(ValueState, ValueAssistant)
      .registerAssistant(DateTimeEntryState, DateTimeEntryAssistant)
      .registerActionButton(Action, ActionButton);
    _proxiedEvents.set(this, new Map());
    _tokenXIcon.set(this, tokenXIcon);
    _multivalueDelimiterKey.set(this, multivalueDelimiterKey);
    _multivaluePasteDelimiter.set(this, multivaluePasteDelimiter);
    // ensure that the multivalueDelimiter is proxied to assistants
    if (proxiedEvents.indexOf(multivalueDelimiterKey) < 0) {
      proxiedEvents.push(multivalueDelimiterKey);
    }
    proxiedEvents.forEach(e => _proxiedEvents.get(this).set(e, true));
    _cssClass.set(this, cssClass);
    _cancelOnBlur.set(this, cancelOnBlur);
    _displayCancelOnCreate.set(this, displayCancelOnCreate);
    _onAcceptSuggestion.set(this, onAcceptSuggestion);
    _onRejectSuggestion.set(this, onRejectSuggestion);
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
   * Register a new component as the "action button" for a certain `Action` type.
   *
   * @param {Action} templateClass - A class extending `Action`.
   * @param {Component} actionButtonClass - A class extending `Component`, which can supply values to an `Action`.
   * @returns {Lex} A reference to `this` for chaining.
   */
  registerActionButton (templateClass, actionButtonClass) {
    _builders.get(this).registerActionButton(templateClass, actionButtonClass);
    return this;
  }

  /**
   * Define a new search language.
   *
   * @param {string} vkey - The (optional) unique key used to store this state's value within a `Token` output object. If not supplied, this state won't be represented in the `Token` value.
   * @param {State} StateKlass - The root state - must be a class which extends `State`.
   * @param {Object} config - Construction parameters for the root `State` class.
   * @returns {StateTemplate} A reference to the new root `StateTemplate`, for chaining purposes to `.addChild()`.
   * @example
   * import { Lex } from 'lex';
   * Lex.from('field', ValueState, {
   *   name: 'Choose a field to search',
   *   options:[
   *     new ValueStateValue('Name', {type: 'string'}),
   *     new ValueStateValue('Income', {type: 'number'})
   *   ]
   * }).to(...).to(...) // to() has the same signature as from()
   */
  static from (vkey, StateKlass, config = {}) {
    // vkey is optional, so we have to jump through some hoops
    let Klass = StateKlass;
    let confObj = config;
    if (typeof vkey === 'string') {
      confObj.vkey = vkey;
    } else {
      Klass = vkey;
      confObj = StateKlass;
    }
    return new StateTemplate(Klass, confObj);
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
        popupContainer={_popupContainer.get(this)}
        value={_defaultValue.get(this)}
        builders={_builders.get(this)}
        machineTemplate={_language.get(this)}
        proxiedEvents={_proxiedEvents.get(this)}
        tokenXIcon={_tokenXIcon.get(this)}
        cssClass={_cssClass.get(this)}
        cancelOnBlur={_cancelOnBlur.get(this)}
        displayCancelOnCreate={_displayCancelOnCreate.get(this)}
        multivalueDelimiter={_multivalueDelimiterKey.get(this)}
        multivaluePasteDelimiter={_multivaluePasteDelimiter.get(this)}
        onQueryChanged={(...args) => this.emit('query changed', ...args)}
        onSuggestionsChanged={(...args) => this.emit('suggestions changed', ...args)}
        onAcceptSuggestion={_onAcceptSuggestion.get(this)}
        onRejectSuggestion={_onRejectSuggestion.get(this)}
        onValidityChanged={(...args) => this.emit('validity changed', ...args)}
        onStartToken={() => this.emit('token start')}
        onEndToken={() => this.emit('token end')}
        onTokenAction={(...args) => this.emit('token action', ...args)}
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
   *
   * @param {boolean} shouldFireChangeEvent - If false, suppresses associated `'query changed' event. Defaults to true.
   */
  reset (shouldFireChangeEvent = true) {
    if (this.searchBar) {
      this.searchBar.setValue(_defaultValue.get(this), shouldFireChangeEvent);
    }
  }

  /**
   * Suggestion tokens.
   *
   * @param {Object[]} suggestions - One or more token values (an array of objects of boxed or unboxed values) to display as "suggestions" in the search bar. Will have different styling than a traditional token, and offer the user an "ADD" button they can use to lock the preview token into their query.
   * @param {boolean} shouldFireChangeEvent - If false, suppresses associated `'query changed'` event. Defaults to true.
   * @returns {Promise} Resolves when the attempt to rewrite the query is finished. This is `async` due to the fact that `State`s such as `ValueState`s might retrieve their suggestions asynchronously.
   */
  async setSuggestions (suggestions, shouldFireChangeEvent = true) {
    if (this.searchBar) {
      return this.searchBar.setSuggestions(suggestions, shouldFireChangeEvent);
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
   * Enable or disable the search box.
   *
   * @param {boolean} enabled - True iff this Lex should be enabled (default true).
   */
  setEnabled (enabled = true) {
    if (this.searchBar) {
      this.searchBar.setEnabled(enabled);
    }
  }

  /**
   * Rewrite the query.
   *
   * @param {Object[]} query - One or more token values (an array of objects of boxed values) to display to overwrite the current query with.
   * @param {boolean} shouldFireChangeEvent - If false, suppresses associated `'query changed'` event. Defaults to true.
   * @returns {Promise} Resolves when the attempt to rewrite the query is finished. This is `async` due to the fact that `State`s such as `ValueState`s might retrieve their suggestions asynchronously.
   */
  async setQuery (query, shouldFireChangeEvent = true) {
    if (this.searchBar) {
      return this.searchBar.setValue(query, shouldFireChangeEvent);
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
  State,
  Action,
  TransitionFactory,
  // states
  LabelState,
  TerminalState,
  ValueState,
  ValueStateValue,
  RelationState,
  TextRelationState,
  NumericRelationState,
  DateTimeRelationState,
  TextEntryState,
  CurrencyEntryState,
  NumericEntryState,
  EnumEntryState,
  EnumEntryStateValue,
  DateTimeEntryState,
  // Base UI components
  Builder,
  Assistant,
  // UI components
  ValueBuilder,
  ValueAssistant,
  DateTimeEntryBuilder,
  DateTimeEntryAssistant,
  ActionButton,
  // Constants
  KEYS
};
