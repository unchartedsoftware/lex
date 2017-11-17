import { Component } from 'preact';
import { bind } from 'decko';
import { StateTransitionError } from '../lib/errors';
import { OptionSelection } from '../lib/states/generic/option-selection';
import { TokenStateMachine } from '../lib/token-state-machine';

export class TokenTypeSelector extends Component {
  constructor () {
    super(arguments);
    const machineTemplate = new OptionSelection(undefined, 'field selection', []);
    this.machine = new TokenStateMachine(machineTemplate);
    this.machine.on('submit', () => this.submit());
    this.state = {};
  }

  submit () {
    console.log('submit!');
  }

  @bind
  handleKeyDown (e) {
    try {
      switch (e.code) {
        case 'Tab':
          e.preventDefault();
          this.machine.transition();
          break;
        case 'Escape':
          e.preventDefault();
          break;
      }
    } catch (err) {
      if (err instanceof StateTransitionError) {
        this.setState({valid: false, errorMsg: err.message});
      } else {
        throw err;
      }
    }
  }

  @bind
  handleKeyUp (e) {
    console.log(e.target.value);
  }

  render (props, state) {
    return (
      <input type='text'
        className='token-input'
        onKeyDown={this.handleKeyDown}
        onKeyUp={this.handleKeyUp} />
    );
  }
}
