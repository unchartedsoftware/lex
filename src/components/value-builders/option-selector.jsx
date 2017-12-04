import { bind } from 'decko';
import { Builder } from '../builder';

export class OptionSelector extends Builder {
  constructor () {
    super();
    this.state.options = [];
    this.state.optionChangeListener = this.onOptionsChanged.bind(this);
  }

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

  onOptionsChanged (newOptions, oldOptions) {
    this.setState({options: newOptions});
  }

  processProps (props) {
    if (this.state.machineState) this.state.machineState.removeListener(this.state.optionChangeListener);
    super.processProps(props);
    // TODO detach when component unmounts
    this.state.machineState.on('options changed', this.state.optionChangeListener);
    // TODO do we need to modify validation state?
  }

  render (props, {valid, readOnly}) {
    return (
      <input type='text'
        className={valid ? 'token-input' : 'token-input invalid'}
        onKeyDown={this.handleKeyDown}
        onKeyUp={this.handleKeyUp}
        disabled={readOnly} />
    );
  }
}
