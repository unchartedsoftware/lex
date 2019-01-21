/** @jsx h */
import { h } from 'preact';
import { Lex, TransitionFactory, OptionState, OptionStateOption, TextRelationState, NumericRelationState, TextEntryState, CurrencyEntryState, LabelState, DateTimeRelationState, DateTimeEntryState, Action, ActionButton } from '../src/lex';
import '../node_modules/bootstrap-sass/assets/stylesheets/_bootstrap.scss';
import '../node_modules/flatpickr/dist/flatpickr.min.css';

// This array and the following two functions are simulations of a back-end API for fetching options
const options = [
  new OptionStateOption('Name', {type: 'string'}),
  new OptionStateOption('Income', {type: 'currency'}),
  new OptionStateOption('Keywords', {type: 'multistring'}),
  new OptionStateOption('GeoHash', {type: 'geohash'}),
  new OptionStateOption('DateTime', {type: 'datetime'})
];

function fetchOptions (query) {
  return new Promise((resolve) => {
    const lookup = new Map();
    query.forEach(v => lookup.set(v.toLowerCase(), true));
    // This simulates a network call for options (your API should filter based on the hint/context)
    setTimeout(() => {
      resolve(options.filter(o => lookup.has(o.key.toLowerCase())));
    }, 25);
  });
}

function searchOptions (hint) {
  return new Promise((resolve) => {
    setTimeout(() => {
      resolve(options.filter(o => o.key.toLowerCase().indexOf(hint.toLowerCase()) > -1));
    }, 25);
  });
}

class PinAction extends Action {
  initialize () {
    super.initialize();
    this.value = false;
  }
  onAction () {
    super.onAction();
    this.value = !this.value;
  }
  suggestCssClass () {
    if (this.value) {
      return ['token-pinned'];
    } else {
      return [];
    }
  }
}
class PinActionButton extends ActionButton {
  render (_, {action}) { // eslint-disable-line no-unused-vars
    if (action.value === true) {
      return <button className='token-action' onMouseDown={this.onClick}>UNPIN</button>;
    } else {
      return <button className='token-action' onMouseDown={this.onClick}>PIN</button>;
    }
  }
}

const language = Lex.from('field', OptionState, {
  name: 'Choose a field to search',
  options: fetchOptions,
  refreshSuggestions: searchOptions,
  icon: (value) => {
    if (!value) return '<span class="glyphicon glyphicon-search" aria-hidden="true"></span>';
    switch (value.key) {
      case 'Name':
        return '<span class="glyphicon glyphicon-user" aria-hidden="true"></span>';
      case 'Income':
        return '<span class="glyphicon glyphicon-usd" aria-hidden="true"></span>';
      case 'Keywords':
        return '<span class="glyphicon glyphicon-list" aria-hidden="true"></span>';
      case 'DateTime':
        return '<span class="glyphicon glyphicon-time" aria-hidden="true"></span>';
      case 'GeoHash':
        return '<span class="glyphicon glyphicon-globe" aria-hidden="true"></span>';
    }
  }
}).impliesAction(PinAction, {
  name: 'pin token',
  vkey: 'pinned',
  defaultValue: false
}).branch(
  Lex.from('relation', TextRelationState, {
    defaultValue: new OptionStateOption('is', {}, {shortKey: '='}),
    autoAdvanceDefault: true,
    cssClasses: ['token-text-entry'],
    ...TransitionFactory.optionMetaCompare({type: 'string'})
  }).to('value', TextEntryState),
  Lex.from('value', TextEntryState, {
    multivalue: true,
    multivalueLimit: 3,
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
    }).to(LabelState, {label: 'and'}).to('secondaryValue', CurrencyEntryState, {units: 'CAD'})
  ),
  Lex.from('relation', DateTimeRelationState, TransitionFactory.optionMetaCompare({type: 'datetime'})).branch(
    Lex.from('value', DateTimeEntryState, { ...TransitionFactory.optionKeyIsNot('between'), enableTime: true }),
    Lex.from('value', DateTimeEntryState, { ...TransitionFactory.optionKeyIs('between'), enableTime: true })
      .to(LabelState, {label: 'and'}).to('secondaryValue', DateTimeEntryState, {enableTime: true})
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
  tokenXIcon: '<span class="glyphicon glyphicon-remove" aria-hidden="true"></span>',
  cancelOnBlur: true,
  onAcceptSuggestion: (s) => {
    return s;
  },
  onRejectSuggestion: (s) => { // eslint-disable-line no-unused-vars
    return true;
  }
});
lex.registerActionButton(PinAction, PinActionButton);
lex.render(document.getElementById('LexContainer'));
lex.on('query changed', (...args) => console.log('query changed', ...args));
lex.on('suggestions changed', (...args) => console.log('suggestions changed', ...args));
lex.on('validity changed', (...args) => console.log('validity changed', ...args));
lex.on('token start', (...args) => console.log('token start', ...args));
lex.on('token end', (...args) => console.log('token end', ...args));
lex.on('token action', (...args) => console.log('token action', ...args));

// Hooks for demo buttons
window.clearQuery = function () {
  lex.reset();
};
window.setQuery = async function () {
  try {
    await lex.setQuery([
      {field: 'Name', relation: 'is like', value: 'Sean'},
      {field: 'Income', relation: 'equals', value: '12'},
      {field: 'Keywords', value: ['Rob', 'Phil', 'two']},
      {field: 'GeoHash', value: 'geohash things'}
    ]);
    // await lex.setQuery([
    //   {field: options[0], relation: new OptionStateOption('is like'), value: new OptionStateOption('Sean')},
    //   {field: options[1], relation: new OptionStateOption('equals'), value: new OptionStateOption('12')}
    // ]);
  } catch (err) {
    console.log('Something went wrong');
    console.error(err);
  }
};
window.setSuggestions = function () {
  lex.setSuggestions([{field: 'Name', relation: 'is like', value: 'Sean'}]);
};
window.focusSearchBar = function () {
  lex.focus();
};
let enabled = true;
window.toggleEnabled = function () {
  enabled = !enabled;
  lex.setEnabled(enabled);
};
// for debugging purposes only
require('preact/devtools');
