import { Component } from 'preact';
import { bind } from 'decko';
import { StateTransitionError } from '../lib/errors';

export class OptionSelector extends Component {
  constructor () {
    super(arguments);
    this.state = {
      valid: true
    };
  }

  processProps (props) {
    const { machineState, onTransition } = props;
    if (onTransition !== this.state.onTransition) {
      this.setState({
        onTransition: onTransition
      });
    }
    if (machineState !== this.state.machineState) {
      this.setState({
        machineState: machineState
      });
    }
  }

  componentWillMount () {
    this.processProps(this.props);
  }

  componentWillReceiveProps (nextProps) {
    this.processProps(nextProps);
  }

  transition () {
    this.state.onTransition();
  }

  @bind
  handleKeyDown (e) {
    this.state.machineState.unboxedValue = e.target.value;
    try {
      this.setState({valid: true, errorMsg: undefined});
      switch (e.code) {
        case 'Tab':
          e.preventDefault();
          this.transition();
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
    this.state.machineState.unboxedValue = e.target.value;
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
