import { Component } from 'preact';

export class SearchBar extends Component {
  constructor () {
    super(arguments);
    this.state = { tokens: [] };
  }

  render (props, {tokens}) {
    return (
      <div className='search-box form-control'>
        <input type='text' className='token-input' />
      </div>
    );
  }
}
