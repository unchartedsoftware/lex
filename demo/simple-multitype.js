/* @jsx h */
import { h } from 'preact';
import { Lex, TransitionFactory, ValueState, ValueStateValue, TextEntryState, NumericEntryState } from '../src/lex';
import '../node_modules/bootstrap-sass/assets/stylesheets/_bootstrap.scss';

const language = Lex
  .from('field', ValueState, {
    name: 'Choose a field to search',
    // This is our list of suggestions we are providing to the user to select from
    suggestions: [
      new ValueStateValue('Height', { type: 'number' }),
      new ValueStateValue('Name', { type: 'string' })
    ],
    icon: '<span class="glyphicon glyphicon-search" aria-hidden="true"></span>'
  })
  // Now that we have selected an option from the available list we need to provide target
  // states that we can transition to
  .branch(
    Lex.from('value', TextEntryState, {
      // User option meta compare to limit this branch to string fields
      ...TransitionFactory.valueMetaCompare({ type: 'string' })
    }),
    Lex.from('value', NumericEntryState, {
      // User option meta compare to limit this branch to number fields
      ...TransitionFactory.valueMetaCompare({ type: 'number' })
    })
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
