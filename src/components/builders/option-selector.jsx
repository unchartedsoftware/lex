import { bind } from 'decko';
import { Builder } from '../builder';

export class OptionSelector extends Builder {
  constructor () {
    super();
    this.state.options = [];
  }

  componentWillUnmount () {
    this.cleanupListeners();
  }

  cleanupListeners () {
    if (this.state.machineState) this.state.machineState.removeListener('options changed', this.onOptionsChanged);
  }

  @bind
  handleKeyDown (e) {
    this.unboxedValue = e.target.value;
    switch (e.code) {
      case 'Tab':
        e.preventDefault();
        this.transition();
        break;
      case 'Backspace':
        if (e.target.value === undefined || e.target.value === null || e.target.value.length === 0) {
          e.preventDefault();
          this.rewind();
        }
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

  focus () {
    if (this.textInput) this.textInput.focus();
  }

  @bind
  onOptionsChanged (newOptions, oldOptions) {
    this.setState({options: newOptions});
  }

  processProps (props) {
    super.processProps(props);
    this.state.machineState.on('options changed', this.onOptionsChanged);
    // TODO do we need to modify validation state?
  }

  renderInteractive (props, {valid, readOnly}) {
    return (
      <input type='text'
        className={valid ? 'token-input' : 'token-input invalid'}
        onKeyDown={this.handleKeyDown}
        onKeyUp={this.handleKeyUp}
        ref={(input) => { this.textInput = input; }}
        disabled={readOnly} />
    );
  }
}
