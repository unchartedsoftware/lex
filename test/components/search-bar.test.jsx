import { h, render } from 'preact'; // eslint-disable-line no-unused-vars
import { mount } from 'enzyme';
import { expect } from 'chai';
import { Lex, TextEntryState } from '../../src/lex';
import { SearchBar } from '../../src/components/search-bar';

describe('SearchBar', () => {
  it('should render something', done => {
    const language = Lex.from('value', TextEntryState);
    const bar = mount(
      <SearchBar
        machineTemplate={language}
      />
    );
    setTimeout(() => {
      expect(bar.hasClass('lex-box')).to.be.ok;
      done();
    }, 10);
  });
});
