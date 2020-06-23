/* @jsx h */
import { h } from 'preact';
import { Lex, ValueState, ValueStateValue, TextEntryState } from '../src/lex';
import '../node_modules/bootstrap-sass/assets/stylesheets/_bootstrap.scss';

// This array and the following function is a simulation of a back-end API for fetching options
const options = [
  new ValueStateValue('First Name'),
  new ValueStateValue('Last Name')
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

// Since we want to suggest tokens for the user we will start with a value state
// which makes it easy for lex to provide options to the user
const language = Lex
  .from('field', ValueState, {
    name: 'Choose a field to search',
    // This is our list of suggestions we are providing to the user to select from
    fetchSuggestions: searchOptionsFactory(options, 100),
    icon: '<span class="glyphicon glyphicon-search" aria-hidden="true"></span>'
  })
  // Now that we have selected an option from the available list we need to provide target
  // states that we can transition to
  .branch(
    // We want to let the user supply an arbitrary string value so lets branch to a simple
    // text entry state
    Lex.from('value', TextEntryState)
  );

// Now that we have a language defined we can initialize our lex instance
const lex = new Lex({
  language: language,
  tokenXIcon: '<span class="glyphicon glyphicon-remove" aria-hidden="true"></span>'
});

// Render our search bar into our desired element
lex.render(document.getElementById('LexContainer'));

// Focus the search bar now that its rendered
lex.focus();
