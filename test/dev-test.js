/** @jsx h */
import { h } from 'preact';
import { Lex, TransitionFactory, OptionState, OptionStateOption, TextRelationState, NumericRelationState, TextEntryState, CurrencyEntryState, LabelState, DateTimeRelationState, DateTimeEntryState } from '../src/lex';
import '../node_modules/bootstrap-sass/assets/stylesheets/_bootstrap.scss';
import '../node_modules/tiny-date-picker/tiny-date-picker.css';

class BrokenEntryState extends TextEntryState {
  initialize (context) {
    super.initialize(context);

    this.context = context;
  }

  formatUnboxedValue (key) {
    // the relation key will be the same for both tokens
    // even though in setQuery we set them differently
    // Check the console, it should say `is like Sean`
    // and `is like Bob` when Bob's relation should be `is`
    console.log(this.context.relation.key, key);
    return key;
  }
}

const language = Lex.from('field', OptionState, {
  name: 'Choose a field to search',
  options: function (hint = '', context) { // eslint-disable-line no-unused-vars
    // This simulates a network call for options (your API should filter based on the hint/context)
    return new Promise((resolve) => {
      setTimeout(() => {
        resolve([
          new OptionStateOption('Name', {type: 'string'}),
          new OptionStateOption('Income', {type: 'currency'}),
          new OptionStateOption('Keywords', {type: 'multistring'}),
          new OptionStateOption('Date', {type: 'datetime'}),
          new OptionStateOption('GeoHash', {type: 'geohash'}, {hidden: true})
        ].filter(o => o.key.toLowerCase().indexOf(hint.toLowerCase()) > -1));
      }, 25);
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
      case 'Date':
        return '<span class="glyphicon glyphicon-time" aria-hidden="true"></span>';
      case 'GeoHash':
        return '<span class="glyphicon glyphicon-globe" aria-hidden="true"></span>';
    }
  }
}).branch(
  Lex.from('relation', TextRelationState, TransitionFactory.optionMetaCompare({type: 'string'})).to('value', BrokenEntryState),
  Lex.from('value', TextEntryState, {
    multivalue: true,
    options: [
      'lex',
      'multi-value',
      'entry',
      'text'
    ].map(t => new OptionStateOption(t)),
    ...TransitionFactory.optionMetaCompare({type: 'multistring'})
  }),
  Lex.from('relation', NumericRelationState, TransitionFactory.optionMetaCompare({type: 'currency'})).branch(
    Lex.from('value', CurrencyEntryState, { units: 'CAD', ...TransitionFactory.optionKeyIsNot('between') }),
    // override icon in this state as an example. Last icon specified in the chain is used.
    Lex.from('value', CurrencyEntryState, {
      icon: () => '<span class="glyphicon glyphicon-usd" aria-hidden="true"></span><span class="glyphicon glyphicon-usd" aria-hidden="true"></span>',
      units: 'CAD',
      ...TransitionFactory.optionKeyIs('between')
    }).to(LabelState, {label: 'and'}).to('secondaryValue', CurrencyEntryState, { units: 'CAD' })
  ),
  Lex.from('relation', DateTimeRelationState, TransitionFactory.optionMetaCompare({type: 'datetime'})).branch(
    Lex.from('value', DateTimeEntryState, TransitionFactory.optionKeyIsNot('between')),
    Lex.from('value', DateTimeEntryState, TransitionFactory.optionKeyIs('between')).to(LabelState, {label: 'and'}).to('secondaryValue', DateTimeEntryState)
  ),
  Lex.from('value', TextEntryState, {
    bindOnly: true, // this state can only be transitioned to programmatically, not interactively
    ...TransitionFactory.optionMetaCompare({type: 'geohash'})
  })
);

const lex = new Lex({
  language: language,
  placeholder: 'Start typing to search...',
  defaultValue: [],
  tokenXIcon: '<span class="glyphicon glyphicon-remove" aria-hidden="true"></span>'
});

lex.render(document.getElementById('LexContainer'));
lex.on('query changed', (...args) => console.log('query changed', ...args));
lex.on('suggestions changed', (...args) => console.log('suggestions changed', ...args));
lex.on('validity changed', (...args) => console.log('validity changed', ...args));
lex.on('token start', (...args) => console.log('token start', ...args));
lex.on('token end', (...args) => console.log('token end', ...args));

// Only happens with setQuery I think
lex.setQuery([
  {field: 'Name', relation: 'is like', value: 'Sean'},
  {field: 'Name', relation: 'is', value: 'Bob'}
]);

// Hooks for demo buttons
window.clearQuery = function () {
  lex.reset();
};
window.setQuery = function () {
  lex.setQuery([
    {field: 'Name', relation: 'is like', value: 'Sean'},
    {field: 'Income', relation: 'equals', value: '12'},
    {field: 'Keywords', value: ['Rob', 'Phil']},
    {field: 'GeoHash', value: 'geohash things'}
  ]);
};
window.setSuggestions = function () {
  lex.setSuggestions([{field: 'Name', relation: 'is like', value: 'Sean'}]);
};
window.focusSearchBar = function () {
  lex.focus();
};
// for debugging purposes only
require('preact/devtools');
