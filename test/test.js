/** @jsx h */
import { h } from 'preact';
import { Lex, TransitionFactory, OptionState, OptionStateOption, TextRelationState, NumericRelationState, TextEntryState, NumericEntryState, LabelState } from '../src/lex';
import '../node_modules/bootstrap-sass/assets/stylesheets/_bootstrap.scss';

// TODO make chainable using some kind of awesome Builder class
const language = Lex.from(OptionState, {
  name: 'Choose a field to search',
  options: function () {
    return new Promise((resolve) => {
      resolve([
        new OptionStateOption('Name', {type: 'string'}),
        new OptionStateOption('Income', {type: 'number'})
      ]);
    });
  }
}).branch(
  Lex.from(TextRelationState, TransitionFactory.optionMetaCompare({type: 'string'})).to(TextEntryState),
  Lex.from(NumericRelationState, TransitionFactory.optionMetaCompare({type: 'number'})).branch(
    Lex.from(NumericEntryState, TransitionFactory.optionKeyIsNot('between')),
    Lex.from(NumericEntryState, TransitionFactory.optionKeyIs('between')).to(LabelState, {label: 'and'}).to(NumericEntryState)
  )
);

const lex = new Lex({language, defaultValue: []});

lex.render(document.getElementById('LexContainer'));
lex.on('query changed', (...args) => console.log('query changed', ...args));
lex.on('validity changed', (...args) => console.log('validity changed', ...args));
lex.on('token start', (...args) => console.log('token start', ...args));
lex.on('token end', (...args) => console.log('token end', ...args));

// Hooks for demo buttons
window.clearQuery = function () {
  lex.reset();
};
// for debugging purposes only
require('preact/devtools');
