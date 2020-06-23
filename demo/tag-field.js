/* @jsx h */
import { h } from 'preact';
import { Lex, ValueState, ValueStateValue } from '../src/lex';
import '../node_modules/bootstrap-sass/assets/stylesheets/_bootstrap.scss';

// This array and the following function is a simulation of a back-end API for fetching options
const options = [
  new ValueStateValue('one'),
  new ValueStateValue('two'),
  new ValueStateValue('three'),
  new ValueStateValue('four'),
  new ValueStateValue('five')
];

function searchTags (options, delay = 0) {
  return function (hint) {
    return new Promise((resolve) => {
      setTimeout(() => {
        if (hint.length > 0) {
          resolve(options.filter(o => o.key.toLowerCase().indexOf(hint.toLowerCase()) === 0));
        } else {
          resolve([]);
        }
      }, delay);
    });
  };
}

// Since we want to suggest tokens for the user we will start with an option state
// which makes it easy for lex to provide options to the user
const language = Lex
  .from('value', ValueState, {
    name: 'Start typing to see suggestions',
    allowUnknown: true,
    // This is our list of suggestions we are providing to the user to select from
    fetchSuggestions: searchTags(options, 100), // a 100 ms delay to simulate an async call
    icon: ''
  });

// Now that we have a language defined we can initialize our lex instance
const lex = new Lex({
  language: language,
  tokenXIcon: '<span class="glyphicon glyphicon-remove" aria-hidden="true"></span>'
});

// Render our search bar into our desired element
lex.render(document.getElementById('LexContainer'));

// Focus the search bar now that its rendered
lex.focus();
