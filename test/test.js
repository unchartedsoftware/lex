/** @jsx h */
import { h } from 'preact';
import { Lex, TransitionFactory, OptionState, OptionStateOption, TextRelationState, NumericRelationState, TextEntryState, MultiTextEntryState, NumericEntryState, LabelState } from '../src/lex';
import '../node_modules/bootstrap-sass/assets/stylesheets/_bootstrap.scss';

const language = Lex.from('field', OptionState, {
  name: 'Choose a field to search',
  options: function () {
    return new Promise((resolve) => {
      resolve([
        new OptionStateOption('Name', {type: 'string'}),
        new OptionStateOption('Income', {type: 'number'}),
        new OptionStateOption('Keywords', {type: 'multistring'})
      ]);
    });
  },
  icon: (value) => {
    if (!value) return '<span class="glyphicon glyphicon-search" aria-hidden="true"></span>';
    switch (value.key) {
      case 'Name':
        return '<span class="glyphicon glyphicon-user" aria-hidden="true"></span>';
      case 'Income':
        return '<span class="glyphicon glyphicon-usd" aria-hidden="true"></span>';
      case 'Keywords':
        return '<span class="glyphicon glyphicon-list" aria-hidden="true"></span>';
    }
  }
}).branch(
  Lex.from('relation', TextRelationState, TransitionFactory.optionMetaCompare({type: 'string'})).to('value', TextEntryState),
  Lex.from('value', MultiTextEntryState, {
    options: [
      'lex',
      'multi-value',
      'entry',
      'text'
    ].map(t => new OptionStateOption(t)),
    ...TransitionFactory.optionMetaCompare({type: 'multistring'})
  }),
  Lex.from('relation', NumericRelationState, TransitionFactory.optionMetaCompare({type: 'number'})).branch(
    Lex.from('value', NumericEntryState, TransitionFactory.optionKeyIsNot('between')),
    // override icon in this state as an example. Last icon specified in the chain is used.
    Lex.from('value', NumericEntryState, {
      icon: () => '<span class="glyphicon glyphicon-usd" aria-hidden="true"></span><span class="glyphicon glyphicon-usd" aria-hidden="true"></span>',
      ...TransitionFactory.optionKeyIs('between')
    }).to(LabelState, {label: 'and'}).to('secondaryValue', NumericEntryState)
  )
);

const lex = new Lex({
  language: language,
  defaultValue: [],
  tokenXIcon: '<span class="glyphicon glyphicon-remove" aria-hidden="true"></span>'
});

lex.render(document.getElementById('LexContainer'));
lex.on('query changed', (...args) => console.log('query changed', ...args));
lex.on('suggestions changed', (...args) => console.log('suggestions changed', ...args));
lex.on('validity changed', (...args) => console.log('validity changed', ...args));
lex.on('token start', (...args) => console.log('token start', ...args));
lex.on('token end', (...args) => console.log('token end', ...args));

// Hooks for demo buttons
window.clearQuery = function () {
  lex.reset();
};
window.setSuggestions = function () {
  lex.setSuggestions([{field: 'Name', relation: 'is like', value: 'Sean'}]);
};
window.focusSearchBar = function () {
  lex.focus();
};
// for debugging purposes only
require('preact/devtools');
