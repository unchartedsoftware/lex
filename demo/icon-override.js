/** @jsx h */
import { h } from 'preact';
import { Lex, TransitionFactory, OptionState, OptionStateOption, TextEntryState, NumericEntryState, NumericRelationState, LabelState } from '../src/lex';
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
        return option.key.toLowerCase().indexOf(hint.toLowerCase()) > -1;
      }

      // Return a list of options for the user to pick from
      return [
        // We are making use of the meta data to provide more context to our options so that
        // we can target them in our branches later on
        new OptionStateOption('Height', { type: 'number' }),
        new OptionStateOption('Name', { type: 'string' })
      ].filter(optionMatchesHint);
    },
    icon: (value) => {
      // Define icons to be used for each property
      if (!value) return '<span class="glyphicon glyphicon-search" aria-hidden="true"></span>';
      switch (value.key) {
        case 'Name':
          return '<span class="glyphicon glyphicon-user" aria-hidden="true"></span>';
        case 'Height':
          return '<span class="glyphicon glyphicon-resize-vertical" aria-hidden="true"></span>';
      }
    }
  })
  // Now that we have selected an option from the available list we need to provide target
  // states that we can transition to
  .branch(
    Lex.from('value', TextEntryState, {
      // User option meta compare to limit this branch to string fields
      ...TransitionFactory.optionMetaCompare({ type: 'string' })
    }),
    // For numbers we want to add the ability to modify the search relationship
    Lex
      .from('relation', NumericRelationState, TransitionFactory.optionMetaCompare({type: 'number'}))
      .branch(
        // When the option is not "between" we just use a simple numeric entry
        Lex.from('value', NumericEntryState, TransitionFactory.optionKeyIsNot('between')),
        // When the option is "between" we want to go deeper to provide a better result token
        Lex
          .from('value', NumericEntryState, {
            // Override icon in this state, last icon specified in the chain is used.
            icon: () => {
              return `
                <span class="glyphicon glyphicon-arrow-up" aria-hidden="true"></span>
                <span class="glyphicon glyphicon-arrow-down" aria-hidden="true"></span>
              `;
            },
            ...TransitionFactory.optionKeyIs('between')
          })
          // Once we have the first value lets add a label "and" to make the token more readable
          .to(LabelState, {label: 'and'})
          // Then we continue onto accepting the second number value
          .to('secondaryValue', NumericEntryState)
      )
  );

// Now that we have a language defined we can initialize our lex instance
const lex = new Lex({
  language: language,
  // Override the close icon that lex displays
  tokenXIcon: '<span class="glyphicon glyphicon-remove" aria-hidden="true"></span>'
});

// Render our search bar into our desired element
lex.render(document.getElementById('LexContainer'));

// Focus the search bar now that its rendered
lex.focus();
