import { Component } from 'preact';
import { bind } from 'decko';
import { StateTransitionError } from '../lib/errors';
import { Option, OptionSelection } from '../lib/states/generic/option-selection';
import { TokenStateMachine } from '../lib/token-state-machine';

export class OptionSelector extends Component {
  constructor () {
    super(arguments);
    const options = [
      new Option('first')
    ];
    const machineTemplate = new OptionSelection(undefined, 'field selection', options);
    this.machine = new TokenStateMachine(machineTemplate);
    this.machine.on('submit', () => this.submit());
    this.state = {valid: true};
  }

  submit () {
    console.log('submit!');
  }

  @bind
  handleKeyDown (e) {
    this.machine.state.unboxedValue = e.target.value;
    try {
      this.setState({valid: true, errorMsg: undefined});
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
    this.machine.state.unboxedValue = e.target.value;
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
