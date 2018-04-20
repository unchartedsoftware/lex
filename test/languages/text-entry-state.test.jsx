import { h, render } from 'preact'; // eslint-disable-line no-unused-vars
import { expect } from 'chai'; // eslint-disable-line no-unused-vars
import { Lex, TextEntryState } from '../../src/lex';

describe('lex', () => {
  let scratch, $, mount; // eslint-disable-line no-unused-vars

  beforeAll(() => {
    scratch = document.createElement('div');
    (document.body || document.documentElement).appendChild(scratch);
    $ = s => scratch.querySelector(s);
    mount = jsx => render(jsx, scratch, scratch.firstChild);
  });

  beforeEach(() => {
    scratch.innerHTML = '';
  });

  afterAll(() => {
    scratch.parentNode.removeChild(scratch);
    scratch = null;
  });

  describe('TextEntryState', () => {
    it('should support the entry of a single value', async () => {
      const language = Lex.from('value', TextEntryState);
      const lex = new Lex({
        language: language
      });
      lex.on('query changed', (...args) => console.log('query changed', ...args));
      lex.on('suggestions changed', (...args) => console.log('suggestions changed', ...args));
      lex.on('validity changed', (...args) => console.log('validity changed', ...args));
      lex.on('token start', (...args) => console.log('token start', ...args));
      lex.on('token end', (...args) => console.log('token end', ...args));
      lex.render(scratch);
      await wait();
      $('.lex-box').focus();
      await wait();
      // $('input.token-input').value = 'Some random text';
      // simulant.fire($('input.token-input'), 'input', { target: { value: $('input.token-input').value } });
      // simulant.fire($('input.token-input'), 'change');
      await type($('input.token-input'), 'Some random text');
      simulant.fire($('input.token-input'), 'keydown', { key: 'Enter' });
    });
  });
});
