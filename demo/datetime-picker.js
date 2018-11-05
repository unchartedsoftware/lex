/** @jsx h */
import { h } from 'preact';
import { Lex, TransitionFactory, OptionState, OptionStateOption, LabelState, DateTimeRelationState, DateTimeEntryState } from '../src/lex';
import '../node_modules/bootstrap-sass/assets/stylesheets/_bootstrap.scss';
import '../node_modules/flatpickr/dist/flatpickr.min.css';

// This array and the following two functions are simulations of a back-end API for fetching options
const options = [
  new OptionStateOption('Date', {type: 'date'}),
  new OptionStateOption('Time', {type: 'time'}),
  new OptionStateOption('DateTime', {type: 'datetime'}),
  new OptionStateOption('DateTime 24hr', {type: 'datetime24hr'})
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

const SECONDS = 1000;
const MINUTES = SECONDS * 60;
const HOURS = MINUTES * 60;
const DAYS = HOURS * 24;
const YESTERDAY_AT_MIDNIGHT = new Date();
YESTERDAY_AT_MIDNIGHT.setHours(0, 0, 0, 0);
const TODAY_AT_LUNCH = new Date(YESTERDAY_AT_MIDNIGHT.valueOf() + (12 * HOURS));

const language = Lex.from('field', OptionState, {
  name: 'Choose a field to search',
  options: fetchOptions,
  refreshSuggestions: searchOptions,
  icon: (value) => {
    if (!value) return '<span class="glyphicon glyphicon-search" aria-hidden="true"></span>';
    return '<span class="glyphicon glyphicon-time" aria-hidden="true"></span>';
  }
}).branch(
  Lex.from('relation', DateTimeRelationState, TransitionFactory.optionMetaCompare({type: 'date'})).branch(
    // This example displays the functionality of minDay, maxDate, and hilightedDate
    Lex.from('value', DateTimeEntryState, {
      ...TransitionFactory.optionKeyIsNot('between'),
      minDate: new Date(Date.now() - 30 * DAYS),
      hilightedDate: new Date(Date.now() - 30 * DAYS),
      maxDate: new Date(Date.now() + 2 * DAYS),
      timezone: 'America/Toronto'
    }),
    Lex.from('value', DateTimeEntryState, TransitionFactory.optionKeyIs('between')).to(LabelState, {label: 'and'}).to('secondaryValue', DateTimeEntryState)
  ),
  Lex.from('relation', DateTimeRelationState, TransitionFactory.optionMetaCompare({type: 'time'})).branch(
    // This example displays the functionality of minDate, and maxDate as it applies to the time picker
    Lex.from('value', DateTimeEntryState, {
      ...TransitionFactory.optionKeyIsNot('between'),
      minDate: YESTERDAY_AT_MIDNIGHT,
      maxDate: TODAY_AT_LUNCH,
      enableTime: true,
      enableCalendar: false,
      timezone: 'America/Toronto'
    }),
    Lex.from('value', DateTimeEntryState, {
      ...TransitionFactory.optionKeyIs('between'),
      minDate: YESTERDAY_AT_MIDNIGHT,
      maxDate: TODAY_AT_LUNCH,
      enableTime: true,
      enableCalendar: false,
      timezone: 'America/Toronto'
    }).to(LabelState, {label: 'and'}).to('secondaryValue', DateTimeEntryState, {
      minDate: YESTERDAY_AT_MIDNIGHT,
      maxDate: TODAY_AT_LUNCH,
      enableTime: true,
      enableCalendar: false,
      timezone: 'America/Toronto'
    })
  ),
  Lex.from('relation', DateTimeRelationState, TransitionFactory.optionMetaCompare({type: 'datetime'})).branch(
    // This example displays the functionality of the date + time picker in 12 hour format (default)
    Lex.from('value', DateTimeEntryState, {
      ...TransitionFactory.optionKeyIsNot('between'),
      enableTime: true,
      enableCalendar: true,
      timezone: 'America/Toronto'
    }),
    Lex.from('value', DateTimeEntryState, {
      ...TransitionFactory.optionKeyIs('between'),
      enableTime: true,
      enableCalendar: true,
      timezone: 'America/Toronto'
    }).to(LabelState, {label: 'and'}).to('secondaryValue', DateTimeEntryState, {
      enableTime: true,
      enableCalendar: true,
      timezone: 'America/Toronto'
    })
  ),
  Lex.from('relation', DateTimeRelationState, TransitionFactory.optionMetaCompare({type: 'datetime24hr'})).branch(
    // This example displays the functionality of the date + time picker in 24 hour format
    Lex.from('value', DateTimeEntryState, {
      ...TransitionFactory.optionKeyIsNot('between'),
      enableTime: true,
      enableCalendar: true,
      time24hr: true,
      timezone: 'America/Toronto'
    }),
    Lex.from('value', DateTimeEntryState, {
      ...TransitionFactory.optionKeyIs('between'),
      enableTime: true,
      enableCalendar: true,
      time24hr: true,
      timezone: 'America/Toronto'
    }).to(LabelState, {label: 'and'}).to('secondaryValue', DateTimeEntryState, {
      enableTime: true,
      enableCalendar: true,
      time24hr: true,
      timezone: 'America/Toronto'
    })
  )
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
      {field: 'Date', relation: 'equals', value: new Date()},
      {field: 'Time', relation: 'equals', value: new Date()},
      {field: 'DateTime', relation: 'equals', value: new Date()},
      {field: 'DateTime 24hr', relation: 'equals', value: new Date()}
    ]);
  } catch (err) {
    console.log('Something went wrong');
    console.error(err);
  }
};
window.setSuggestions = function () {
  lex.setSuggestions([{field: 'Time', relation: 'equals', value: TODAY_AT_LUNCH}]);
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
