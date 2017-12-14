/** @jsx h */
import { h } from 'preact';
import { Lex, OptionState, OptionStateOption, TextRelationState, NumericRelationState, TextEntryState, NumericEntryState } from '../src/lex';
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
  Lex.from(TextRelationState, {
    transition: (parentVal) => parentVal && parentVal.meta.type === 'string'
  }).to(TextEntryState),
  Lex.from(NumericRelationState, {
    transition: (parentVal) => parentVal && parentVal.meta.type === 'number'
  }).branch(
    Lex.from(NumericEntryState, {
      transition: (parentVal) => parentVal && parentVal.key !== 'between'
    }),
    Lex.from(NumericEntryState, {
      transition: (parentVal) => parentVal && parentVal.key === 'between'
    }).to(NumericEntryState)
  )
);

const lex = new Lex(language);

lex.render(document.getElementById('LexContainer'));
