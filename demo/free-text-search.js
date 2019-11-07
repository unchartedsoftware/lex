/* @jsx h */
import { h } from 'preact';
import { Lex, TokenSuggestionState, TokenSuggestionStateValue, TransitionFactory, ValueState, ValueStateValue, TextEntryState, NumericEntryState } from '../src/lex';
import '../node_modules/bootstrap-sass/assets/stylesheets/_bootstrap.scss';

const options = [
  new ValueStateValue('First Name', {type: 'string'}),
  new ValueStateValue('Last Name', {type: 'string'}),
  new ValueStateValue('Age', {type: 'numeric'})
];

// Since we want to support free text search, we root the language with a TokenSuggestionState.
// The rest of the language, which would have traditionally been rooted at a ValueState, follows.
const language = Lex
  .from('freetext', TokenSuggestionState, {
    tokenSuggestions: [
      new TokenSuggestionStateValue([/^[A-Za-z]+$/], (match) => `Search "${match[0]}" as a First Name`, (match) => {
        return {
          field: options[0],
          value: new ValueStateValue(match[0])
        };
      }),
      new TokenSuggestionStateValue([/^[A-Za-z]+$/], (match) => `Search "${match[0]}" as a Last Name`, (match) => {
        return {
          field: options[1],
          value: new ValueStateValue(match[0])
        };
      }),
      new TokenSuggestionStateValue([/^(\d+)$/], (match) => `Search "${match[0]}" as Age`, (match) => {
        return {
          field: options[2],
          value: new ValueStateValue(match[1])
        };
      })
    ]
  })
  .to('field', ValueState, {
    name: 'Choose a field to search',
    // This is our list of suggestions we are providing to the user to select from
    suggestions: options,
    icon: '<span class="glyphicon glyphicon-search" aria-hidden="true"></span>'
  })
  // Now that the user has selected an option from the available list, provide a
  // TextEntryState to allow the user to supply a value.
  .branch(
    Lex.from('value', TextEntryState, TransitionFactory.valueMetaCompare({type: 'string'})),
    Lex.from('value', NumericEntryState, TransitionFactory.valueMetaCompare({type: 'numeric'}))
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
