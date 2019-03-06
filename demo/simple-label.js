/** @jsx h */
import { h } from 'preact';
import { Lex, ValueState, ValueStateValue, NumericEntryState, LabelState } from '../src/lex';
import '../node_modules/bootstrap-sass/assets/stylesheets/_bootstrap.scss';

/**
 * Our goal is to create a search box that suggests tokens using a hint and lets us
 * enter values for each token.
 */
// Since we want to suggest tokens for the user we will start with an option state
// which makes it easy for lex to provide options to the user
const language = Lex
  .from('field', ValueState, {
    name: 'Choose a field to search',
    // This is our list of suggestions we are providing to the user to select from
    suggestions: [
      new ValueStateValue('Height')
    ],
    icon: '<span class="glyphicon glyphicon-search" aria-hidden="true"></span>'
  })
  // We want to let the user supply a height in feet and inches, to do this we are going
  // to combine 2 number entry states with a label state between them
  .to('heightFeet', NumericEntryState, {units: "'"})
  .to(LabelState, {label: 'and'})
  .to('heightInches', NumericEntryState, {units: "'"});

// Now that we have a language defined we can initialize our lex instance
const lex = new Lex({
  language: language,
  tokenXIcon: '<span class="glyphicon glyphicon-remove" aria-hidden="true"></span>'
});

// Render our search bar into our desired element
lex.render(document.getElementById('LexContainer'));

// Focus the search bar now that its rendered
lex.focus();
