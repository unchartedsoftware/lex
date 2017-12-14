// /** @jsx h */
import './style/lex.scss';
import { h, render } from 'preact';
import EventEmitter from 'wolfy87-eventemitter';
import { StateTransitionError, NoStateAssistantTypeError, NoStateBuilderTypeError } from './lib/errors';
import { StateTemplate } from './lib/state';
import { StateBuilderFactory } from './lib/state-builder-factory';
import { SearchBar } from './components/search-bar';
import { OptionStateOption, OptionState } from './lib/states/generic/option-state';
import { TextRelationState } from './lib/states/text/text-relation-state';
import { NumericRelationState } from './lib/states/numeric/numeric-relation-state';
import { TextEntryState } from './lib/states/text/text-entry-state';
import { NumericEntryState } from './lib/states/numeric/numeric-entry-state';
import { OptionSelector } from './components/builders/generic/option-selector';
import { OptionAssistant } from './components/assistants/generic/option-assistant';

const sLanguage = Symbol('language');
const sBuilders = Symbol('builders');

/**
 * Lex - A micro-framework for building search bars.
 *
 * @param {StateTemplate} language - The root state of the search language this bar will support.
 * @example
 * // Instantiate a new instance of lex and bind it to the page.
 * const lex = new Lex(language);
 * lex.render(document.getElementById('lex-container'));
 * @example
 * // Override default builder/assistant associations
 * const lex = new Lex(language);
 * lex.registerBuilder(OptionState, MyCustomOptionSelector);
 */
class Lex extends EventEmitter {
  constructor (language) {
    super();
    // TODO throw if language is not instanceof StateTemplate
    this[sLanguage] = language.root;
    this[sBuilders] = new StateBuilderFactory();
    this[sBuilders].registerBuilder(OptionState, OptionSelector)
      .registerBuilder(TextRelationState, OptionSelector)
      .registerBuilder(TextEntryState, OptionSelector)
      .registerBuilder(NumericRelationState, OptionSelector)
      .registerBuilder(NumericEntryState, OptionSelector)
      .registerAssistant(OptionState, OptionAssistant)
      .registerAssistant(TextRelationState, OptionAssistant)
      .registerAssistant(NumericRelationState, OptionAssistant);
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
        builders={this[sBuilders]}
        machineTemplate={this[sLanguage]}
        onSubmit={(...args) => this.emit('submit', ...args)}
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
}

export {
  Lex,
  // errors
  StateTransitionError,
  NoStateAssistantTypeError,
  NoStateBuilderTypeError,
  // base classes
  StateTemplate,
  // states
  OptionState,
  OptionStateOption,
  TextRelationState,
  NumericRelationState,
  TextEntryState,
  NumericEntryState,
  // UI components
  OptionSelector,
  OptionAssistant
};
