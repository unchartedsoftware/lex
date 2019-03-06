/** @jsx h */
import { h } from 'preact';
import { Lex, TransitionFactory, ValueState, ValueStateValue, TextEntryState, NumericEntryState, NumericRelationState, LabelState } from '../src/lex';
import '../node_modules/bootstrap-sass/assets/stylesheets/_bootstrap.scss';

const language = Lex
  .from('field', ValueState, {
    name: 'Choose a field to search',
    // This is our list of suggestions we are providing to the user to select from
    suggestions: [
      new ValueStateValue('Height', { type: 'number' }),
      new ValueStateValue('Name', { type: 'string' })
    ],
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
        Lex.from('value', NumericEntryState, TransitionFactory.valueKeyIsNot('between')),
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
            ...TransitionFactory.valueKeyIs('between')
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
