/** @jsx h */
import { h } from 'preact';
import { Lex, ValueState, ValueStateValue, TerminalState, TextEntryState, TransitionFactory } from '../src/lex';
import '../node_modules/bootstrap-sass/assets/stylesheets/_bootstrap.scss';

const language = Lex
  .from('field', ValueState, {
    name: 'Choose a field to search',
    // One option will immediately end the token, the other will not.
    suggestions: [
      new ValueStateValue('Name', {type: 'string'}),
      new ValueStateValue('Terminal', {type: 'terminal'})
    ],
    icon: '<span class="glyphicon glyphicon-search" aria-hidden="true"></span>'
  })
  .branch(
    Lex.from('value', TextEntryState, TransitionFactory.optionMetaCompare({type: 'string'})),
    // terminal state is invisible, and simply exists to "end" that branch of the language tree.
    Lex.from('terminal', TerminalState, TransitionFactory.optionMetaCompare({type: 'terminal'}))
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
