import { Component } from 'preact';
import { TokenTypeSelector } from './token-type-selector';

export class SearchBar extends Component {
  constructor () {
    super(arguments);
    this.state = { tokens: [] };
  }

  render (props, {tokens}) {
    return (
      <div className='search-box form-control'>
        {tokens.map(t => <div className='token' />)}
        <TokenTypeSelector />
      </div>
    );
  }
}
