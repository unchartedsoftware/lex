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
import { TextEntryState } from './lib/states/text/text-entry-state';
import { NumericEntryState } from './lib/states/numeric/numeric-entry-state';
import { LabelBuilder } from './components/builders/generic/label-builder';
import { OptionBuilder } from './components/builders/generic/option-builder';
import { OptionAssistant } from './components/assistants/generic/option-assistant';

const sLanguage = Symbol('language');
const sBuilders = Symbol('builders');
const sProxiedEvents = Symbol('proxiedEvents');
const sDefaultValue = Symbol('defaultValue');

/**
 * Lex - A micro-framework for building search bars.
 *
 * This class is an `EventEmitter` and exposes the following events:
 * - `on('token start', () => {})` when the user begins to create or edit a token.
 * - `on('token end', () => {})` when the user finishes creating or editing a token.
 * - `on('query changed', (newModel, oldModel) => {})` when query model changes.
 * - `on('validity changed', (newValidity, oldValidity) => {})` when validity of an active builder changes.
 *
 * @param {object} config - The configuration for this instance of `Lex`.
 * @param {StateTemplate} config.language - The root state of the search language this bar will support.
 * @param {string[]} config.proxiedEvents - A list of keydown events to proxy from `Builder`s to `Assistant`s. If the active `Builder` does not consume said event, it will be sent to the active `Assistant` (if any).
 * @param {Array[]} config.defaultValue - The default search state for this search box.
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
      proxiedEvents = ['ArrowUp', 'ArrowDown', 'Tab', 'Enter'],
      defaultValue = []
    } = config;
    super();
    // TODO throw if language is not instanceof StateTemplate
    this[sLanguage] = language.root;
    this[sBuilders] = new StateBuilderFactory();
    this[sDefaultValue] = defaultValue;
    this[sBuilders].registerBuilder(OptionState, OptionBuilder)
      .registerBuilder(TextRelationState, OptionBuilder)
      .registerBuilder(TextEntryState, OptionBuilder)
      .registerBuilder(NumericRelationState, OptionBuilder)
      .registerBuilder(NumericEntryState, OptionBuilder)
      .registerBuilder(LabelState, LabelBuilder)
      .registerAssistant(OptionState, OptionAssistant)
      .registerAssistant(TextRelationState, OptionAssistant)
      .registerAssistant(NumericRelationState, OptionAssistant);
    this[sProxiedEvents] = new Map();
    proxiedEvents.forEach(e => this[sProxiedEvents].set(e, true));
  }

  /**
   * Register a new component as the "builder" for a certain `StateTemplate` type.
   *
   * @param {StateTemplate} templateClass - A class extending `StateTemplate`.
   * @param {Component} builderClass - A class extending `Component`, which can supply values to a `State` created from the `StateTemplate`.
   * @returns {Lex} A reference to `this` for chaining.
   */
  registerBuilder (templateClass, builderClass) {
    this[sBuilders].registerBuilder(templateClass, builderClass);
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
    this[sBuilders].registerAssistant(templateClass, assistantClass);
    return this;
  }

  /**
   * Define a new search language.
   *
   * @param {StateTemplate} StateTemplateClass - The root state - must be a class which extends `StateTemplate`.
   * @param {Object} config - Construction parameters for the root `StateTemplate` class.
   * @returns {StateTemplate} A reference to the new root `State`, for chaining purposes to `.addChild()`.
   * @example
   * import { Lex } from 'lex';
   * Lex.from(OptionState, {
   *   name: 'Choose a field to search',
   *   options:[
   *     new OptionStateOption('Name', {type: 'string'}),
   *     new OptionStateOption('Income', {type: 'number'})
   *   ]
   * }).to(...).to(...)
   */
  static from (StateTemplateClass, config = {}) {
    return new StateTemplateClass(config);
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
        value={this[sDefaultValue]}
        builders={this[sBuilders]}
        machineTemplate={this[sLanguage]}
        proxiedEvents={this[sProxiedEvents]}
        onQueryChanged={(...args) => this.emit('query changed', ...args)}
        onValidityChanged={(...args) => this.emit('validity changed', ...args)}
        onStartToken={() => this.emit('token start')}
        onEndToken={() => this.emit('token end')}
        ref={(a) => { this.searchBar = a; }}
      />
    ), target);
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
      this.searchBar.value = this[sDefaultValue];
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
  TextEntryState,
  NumericEntryState,
  // UI components
  OptionBuilder,
  OptionAssistant
};
