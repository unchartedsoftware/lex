/** @jsx h */
import { h } from 'preact';
import { Lex, TransitionFactory, OptionState, OptionStateOption, TextEntryState, NumericEntryState } from '../src/lex';
import '../node_modules/bootstrap-sass/assets/stylesheets/_bootstrap.scss';

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
        // We are making use of the meta data to provide more context to our options so that
        // we can target them in our branches later on
        new OptionStateOption('Height', { type: 'number' }),
        new OptionStateOption('Name', { type: 'string' })
      ].filter(optionMatchesHint);
    }
  })
  // Now that we have selected an option from the available list we need to provide target
  // states that we can transition to
  .branch(
    Lex.from('value', TextEntryState, {
      // User option meta compare to limit this branch to string fields
      ...TransitionFactory.optionMetaCompare({ type: 'string' }),
      validate: function (field) {
        // Custom validation method to ensure our value has a length greater than 1
        return field && field.key.length > 1;
      }
    }),
    Lex.from('value', NumericEntryState, {
      // User option meta compare to limit this branch to number fields
      ...TransitionFactory.optionMetaCompare({ type: 'number' }),
      validate: function (field) {
        // Custom validation method to ensure our value is greater than 0
        return field && !isNaN(field.key) && parseInt(field.key) > 0;
      }
    })
  );

// Now that we have a language defined we can initialize our lex instance
const lex = new Lex({
  language: language
});

// Render our search bar into our desired element
lex.render(document.getElementById('LexContainer'));

// Focus the search bar now that its rendered
lex.focus();