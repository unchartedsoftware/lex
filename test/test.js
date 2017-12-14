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

const lex = new Lex(language);

lex.render(document.getElementById('LexContainer'));

// for debugging purposes only
require('preact/devtools');
