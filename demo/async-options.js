/** @jsx h */
import { h } from 'preact';
import { Lex, OptionState, OptionStateOption, TextEntryState } from '../src/lex';
import '../node_modules/bootstrap-sass/assets/stylesheets/_bootstrap.scss';

// This array and the following two functions are simulations of a back-end API for fetching options
const options = [
  new OptionStateOption('First Name'),
  new OptionStateOption('Last Name')
];

function fetchOptions (query) {
  return new Promise((resolve) => {
    const lookup = new Map();
    query.forEach(v => lookup.set(v.toLowerCase()), true);
    // This simulates a network call for options (your API should filter based on the hint/context)
    setTimeout(() => {
      resolve(options.filter(o => lookup.has(o.key.toLowerCase())));
    }, 25);
  });
}

function searchOptions (hint) {
  // It is up to us to filter our options based on the provided hint, we are using
  // a simple check for if our option label contains the current hint
  function optionMatchesHint (option) {
    return option.key.toLowerCase().indexOf(hint.toLowerCase()) > -1;
  }

  // Return a promise here to simulate a network request
  return new Promise((resolve) => {
    setTimeout(() => {
      resolve(options.filter(optionMatchesHint));
    }, 25);
  });
}

// Since we want to suggest tokens for the user we will start with an option state
// which makes it easy for lex to provide options to the user
const language = Lex
  .from('field', OptionState, {
    name: 'Choose a field to search',
    // This is our list of options we are providing to the user to select from
    // we can return a promise from this method as well to support network requests
    options: fetchOptions,
    fetchSuggestions: searchOptions,
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
