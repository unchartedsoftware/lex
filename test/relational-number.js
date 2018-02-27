/** @jsx h */
import { h } from 'preact';
import { Lex, OptionState, OptionStateOption, NumericEntryState, NumericRelationState } from '../src/lex';
import '../node_modules/bootstrap-sass/assets/stylesheets/_bootstrap.scss';

// Since we want to suggest tokens for the user we will start with an option state
// which makes it easy for lex to provide options to the user
const language = Lex
  .from('field', OptionState, {
    name: 'Choose a field to search',
    // This is our list of options we are providing to the user to select from
    // we can return a promise from this method as well to support network requests
    options: function (hint = '', context) { // eslint-disable-line no-unused-vars
      // It is up to us to filter our options based on the provided hint, we are using
      // a simple check for if our option label contains the current hint
      function optionMatchesHint (option) {
        return option.displayKey.toLowerCase().indexOf(hint.toLowerCase()) > -1;
      }

      // Return a list of options for the user to pick from
      return [
        new OptionStateOption('Age'),
        new OptionStateOption('Height'),
        new OptionStateOption('Weight')
      ].filter(optionMatchesHint);
    }
  })
  // Now that we have selected an option from the available list we need to provide target
  // states that we can transition to
  .branch(
    Lex
      .from('relation', NumericRelationState)
      .branch(
        // Now that we have selected a relationship for our property we want to let the user
        // supply an valid number value so lets branch to a numeric entry state
        Lex.from('value', NumericEntryState)
      )
  );

// Now that we have a language defined we can initialize our lex instance
const lex = new Lex({
  language: language
});

// Render our search bar into our desired element
lex.render(document.getElementById('LexContainer'));

// Focus the search bar now that its rendered
lex.focus();