/* @jsx h */
import { h } from 'preact';
import { Lex, TransitionFactory, TokenSuggestionState, TokenSuggestionStateValue, ValueState, ValueStateValue, TextRelationState, NumericRelationState, TextEntryState, CurrencyEntryState, LabelState, DateTimeRelationState, DateTimeEntryState, EnumEntryState, EnumEntryStateValue, Action, ActionButton } from '../src/lex';
import '../node_modules/bootstrap-sass/assets/stylesheets/_bootstrap.scss';
import '../node_modules/flatpickr/dist/flatpickr.min.css';

// This array and the following function is a simulation of a back-end API for fetching options
const options = [
  new ValueStateValue('Name', {type: 'string'}),
  new ValueStateValue('Enum', {type: 'enum'}),
  new ValueStateValue('Income', {type: 'currency'}),
  new ValueStateValue('Keywords', {type: 'multistring'}),
  new ValueStateValue('GeoHash', {type: 'geohash'}, {hidden: true}),
  new ValueStateValue('DateTime', {type: 'datetime'})
];

function searchOptionsFactory (options, delay = 0) {
  return function (hint) {
    console.log(`Fetching options with hint ${hint}...`);
    return new Promise((resolve) => {
      setTimeout(() => {
        resolve(options.filter(o => o.key.toLowerCase().indexOf(hint.toLowerCase()) > -1));
      }, delay);
    });
  };
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

const language = Lex.from('intelligent', TokenSuggestionState, {
  icon: () => '<span class="glyphicon glyphicon-search" aria-hidden="true"></span>',
  tokenSuggestions: [
    new TokenSuggestionStateValue([/^\$?(\d+(?:\.\d\d)?)$/], (match) => `Search "${match[0]}" as Income`, (match) => {
      return {
        field: options[2],
        relation: TextRelationState.IS,
        value: new ValueStateValue(match[1])
      };
    }),
    new TokenSuggestionStateValue([/^[A-Za-z\s]+$/], (match) => `Search "${match[0]}" as a Name`, (match) => {
      return {
        field: options[0],
        relation: TextRelationState.IS,
        value: new ValueStateValue(match[0])
      };
    }),
    new TokenSuggestionStateValue([/^(?:[A-Za-z]+)(?:,\s?[A-Za-z]+){0,2}$/], (match) => `Search "${match[0]}" as Keywords`, (match) => {
      return {
        field: options[3],
        value: match[0].split(',').map(v => new ValueStateValue(v))
      };
    })
  ]
}).to('field', ValueState, {
  name: 'Choose a field to search',
  fetchSuggestions: searchOptionsFactory(options, 250),
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
    defaultValue: TextRelationState.IS,
    autoAdvanceDefault: true,
    // cssClasses: ['token-text-entry'],
    ...TransitionFactory.valueMetaCompare({type: 'string'})
  }).to('value', TextEntryState),
  Lex.from('value', EnumEntryState, {
    enums: [
      new EnumEntryStateValue(1, 'one'),
      new EnumEntryStateValue(2, 'two'),
      new EnumEntryStateValue(3, 'three')
    ],
    multivalue: true,
    ...TransitionFactory.valueMetaCompare({type: 'enum'})
  }),
  Lex.from('value', TextEntryState, {
    multivalue: true,
    multivalueLimit: 3,
    suggestions: [
      'lex',
      'multi-value',
      'entry',
      'text'
    ].map(t => new ValueStateValue(t)),
    ...TransitionFactory.valueMetaCompare({type: 'multistring'})
  }),
  Lex.from('relation', NumericRelationState, TransitionFactory.valueMetaCompare({type: 'currency'})).branch(
    Lex.from('value', CurrencyEntryState, { units: 'CAD', ...TransitionFactory.valueKeyIsNot('between') }),
    // override icon in this state as an example. Last icon specified in the chain is used.
    Lex.from('value', CurrencyEntryState, {
      icon: () => '<span class="glyphicon glyphicon-usd" aria-hidden="true"></span><span class="glyphicon glyphicon-usd" aria-hidden="true"></span>',
      units: 'CAD',
      ...TransitionFactory.valueKeyIs('between')
    }).to(LabelState, {label: 'and'}).to('secondaryValue', CurrencyEntryState, {units: 'CAD'})
  ),
  Lex.from('relation', DateTimeRelationState, TransitionFactory.valueMetaCompare({type: 'datetime'})).branch(
    Lex.from('value', DateTimeEntryState, { ...TransitionFactory.valueKeyIsNot('between'), enableTime: true }),
    Lex.from('value', DateTimeEntryState, { ...TransitionFactory.valueKeyIs('between'), enableTime: true })
      .to(LabelState, {label: 'and'}).to('secondaryValue', DateTimeEntryState, {enableTime: true})
  ),
  Lex.from('value', TextEntryState, {
    bindOnly: true, // this state can only be transitioned to programmatically, not interactively
    ...TransitionFactory.valueMetaCompare({type: 'geohash'})
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
      {intelligent: new ValueStateValue(''), field: options[0], relation: TextRelationState.IS_LIKE, value: new ValueStateValue('Sean')},
      {intelligent: new ValueStateValue(''), field: options[1], relation: NumericRelationState.EQUALS, value: new EnumEntryStateValue(2)},
      {intelligent: new ValueStateValue(''), field: options[2], relation: NumericRelationState.EQUALS, value: new ValueStateValue(12)},
      {intelligent: new ValueStateValue(''), field: options[3], value: ['Rob', 'Phil', 'two'].map((k) => new ValueStateValue(k))},
      {intelligent: new ValueStateValue(''), field: options[4], value: new ValueStateValue('geohash things')},
      {intelligent: new ValueStateValue(''), field: options[5], relation: DateTimeRelationState.EQUALS, value: new Date()}
    ]);
  } catch (err) {
    console.log('Something went wrong');
    console.error(err);
  }
};
window.setSuggestions = function () {
  lex.setSuggestions([{field: options[0], relation: TextRelationState.IS_LIKE, value: new ValueStateValue('sean')}]);
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
