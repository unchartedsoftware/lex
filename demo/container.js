/* @jsx h */
import { h } from 'preact';
import { Lex, ValueState, ValueStateValue, TextEntryState, TextRelationState } from '../src/lex';
import '../node_modules/bootstrap-sass/assets/stylesheets/_bootstrap.scss';

// Since we want to suggest tokens for the user we will start with an option state
// which makes it easy for lex to provide options to the user
const language = Lex
  .from('field', ValueState, {
    name: 'Choose a field to search',
    // This is our list of suggestions we are providing to the user to select from
    suggestions: [
      new ValueStateValue('First Name'),
      new ValueStateValue('Last Name')
    ],
    icon: '<span class="glyphicon glyphicon-search" aria-hidden="true"></span>'
  })
  // Now that we have selected an option from the available list we need to provide target
  // states that we can transition to
  .branch(
    Lex
      .from('relation', TextRelationState)
      .branch(
        // Now that we have selected a relationship for our property we want to let the user
        // supply an arbitrary string value so lets branch to a simple text entry state
        Lex.from('value', TextEntryState)
      )
  );

// Now that we have a language defined we can initialize our lex instance
const lex = new Lex({
  container: '#LexSearchPopupContainer',
  language: language,
  tokenXIcon: '<span class="glyphicon glyphicon-remove" aria-hidden="true"></span>'
});

// Render our search bar into our desired element
lex.render(document.getElementById('LexContainer'));

// Focus the search bar now that its rendered
lex.focus();
