/** @jsx h */
import { h } from 'preact';
import { Lex, TransitionFactory, OptionState, OptionStateOption } from '../src/lex';
import '../node_modules/bootstrap-sass/assets/stylesheets/_bootstrap.scss';
import '../node_modules/tiny-date-picker/tiny-date-picker.css';

class SeparatedRelationState extends OptionState {
  constructor (config) {
    if (config.name === undefined) config.name = 'Choose a search option';
    if (config.options === undefined) {
      config.options = [
        ['contains all of', '+'],
        ['contains any of', '?'],
        ['is not', '-'],
        ['is not any of', '≠?']
      ].map(o => new OptionStateOption(o[0], {}, { shortKey: o[1] }));
    }
    super(config);
  }
}

const language = Lex.from('field', OptionState, {
  name: 'Choose a field to search',
  options: function (hint = '', context) { // eslint-disable-line no-unused-vars
    return [
      new OptionStateOption('Category', {type: 'multi-select-operator'})
    ].filter(o => o.key.toLowerCase().indexOf(hint.toLowerCase()) > -1);
  },
  icon: () => {
    return '<span class="glyphicon glyphicon-search" aria-hidden="true"></span>';
  }
}).branch(
  Lex.from('relation', SeparatedRelationState, TransitionFactory.optionMetaCompare({type: 'multi-select-operator'}))
    .to('value', OptionState, {
      multivalue: true,
      options: [
        'option1',
        'option2',
        'option3',
        'option4'
      ].map(t => new OptionStateOption(t))
    })
);

const lex = new Lex({
  language: language,
  placeholder: 'Start typing to search...',
  defaultValue: [],
  tokenXIcon: '<span class="glyphicon glyphicon-remove" aria-hidden="true"></span>'
});

lex.render(document.getElementById('LexContainer'));
lex.on('query changed', (...args) => console.log('query changed', ...args));
lex.on('suggestions changed', (...args) => console.log('suggestions changed', ...args));
lex.on('validity changed', (...args) => console.log('validity changed', ...args));
lex.on('token start', (...args) => console.log('token start', ...args));
lex.on('token end', (...args) => console.log('token end', ...args));

// Hooks for demo buttons
window.clearQuery = function () {
  lex.reset();
};
window.setQuery = async function () {
  try {
    await lex.setQuery([
      {field: 'Category', relation: 'contains all of', value: ['option1']}
    ]);
  } catch (err) {
    console.log('Something went wrong');
  }
};
window.focusSearchBar = function () {
  lex.focus();
};
// for debugging purposes only
require('preact/devtools');
