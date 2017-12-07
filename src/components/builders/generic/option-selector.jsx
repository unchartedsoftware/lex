import linkState from 'linkstate';
import { bind } from 'decko';
import { Builder } from '../../builder';

export class OptionSelector extends Builder {
  constructor () {
    super();
    this.state.options = [];
  }

  componentWillUnmount () {
    this.cleanupListeners();
  }

  cleanupListeners () {
    if (this.state.machineState) {
      this.state.machineState.removeListener('options changed', this.onOptionsChanged);
      this.state.machineState.removeListener('value changed', this.onValueChanged);
    }
  }

  processProps (props) {
    super.processProps(props);
    this.state.machineState.on('options changed', this.onOptionsChanged);
    this.state.machineState.on('value changed', this.onValueChanged);
    // TODO do we need to modify validation state?
  }

  @bind
  handleKeyDown (e) {
    let consumed = true;
    this.unboxedValue = e.target.value;
    switch (e.code) {
      case 'Tab':
        consumed = this.requestTransition(); // only consume the event if the transition succeeds
        break;
      case 'Backspace':
        if (e.target.value === undefined || e.target.value === null || e.target.value.length === 0) {
          this.requestRewind();
        } else {
          consumed = false;
        }
        break;
      case 'Escape':
        // TODO cancellation
        break;
      default:
        consumed = false;
    }
    if (consumed) {
      e.stopPropagation();
      e.preventDefault();
    }
  }

  @bind
  handleKeyUp (e) {
    this.unboxedValue = e.target.value;
    this.state.machineState.template.refreshOptions();
  }

  focus () {
    if (this.textInput) this.textInput.focus();
  }

  @bind
  onOptionsChanged (newOptions, oldOptions) {
    this.setState({options: newOptions});
  }

  @bind
  onValueChanged (newValue) {
    if (newValue) {
      this.setState({typedText: newValue.key});
    }
  }

  renderInteractive (props, {valid, readOnly, typedText}) {
    return (
      <input type='text'
        className={valid ? 'token-input' : 'token-input invalid'}
        onKeyDown={this.handleKeyDown}
        onKeyUp={this.handleKeyUp}
        value={typedText}
        onInput={linkState(this, 'typedText')}
        onFocus={this.requestFocus}
        onBlur={this.requestBlur}
        ref={(input) => { this.textInput = input; }}
        disabled={readOnly} />
    );
  }
}
