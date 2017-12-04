import { bind } from 'decko';
import { Builder } from '../builder';

export class OptionSelector extends Builder {
  @bind
  handleKeyDown (e) {
    this.unboxedValue = e.target.value;
    switch (e.code) {
      case 'Tab':
        e.preventDefault();
        this.transition();
        break;
      case 'Escape':
        e.preventDefault();
        // TODO cancellation
        break;
    }
  }

  @bind
  handleKeyUp (e) {
    this.unboxedValue = e.target.value;
  }

  render (props, state) {
    return (
      <input type='text'
        className={this.state.valid ? 'token-input' : 'token-input invalid'}
        onKeyDown={this.handleKeyDown}
        onKeyUp={this.handleKeyUp} />
    );
  }
}
