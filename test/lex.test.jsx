import { h, render } from 'preact'; // eslint-disable-line no-unused-vars
import { expect } from 'chai';
import { Lex, TextEntryState } from '../src/lex';

describe('lex', () => {
  let scratch;

  beforeAll(() => {
    scratch = document.createElement('div');
    (document.body || document.documentElement).appendChild(scratch);
  });

  beforeEach(() => {
    scratch.innerHTML = '';
  });

  afterAll(() => {
    scratch.parentNode.removeChild(scratch);
    scratch = null;
  });

  describe('from()', () => {
    // TODO
  });

  describe('render()', () => {
    it('should render a basic search bar', async () => {
      const language = Lex.from('value', TextEntryState);
      const lex = new Lex({
        language: language
      });
      lex.render(scratch);
      // await sleep(1);
      expect(scratch.innerHTML).to.include('<div class="lex-box form-control');
    });
  });

  describe('registerBuilder()', () => {
    // TODO
  });

  describe('registerAssistant()', () => {
    // TODO
  });

  describe('unmount()', () => {
    // TODO
  });

  describe('reset()', () => {
    // TODO
  });

  describe('focus()', () => {
    // TODO
  });

  describe('setSuggestions()', () => {
    // TODO
  });

  describe('setQuery()', () => {
    // TODO
  });
});
