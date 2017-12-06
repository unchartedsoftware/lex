import { bind } from 'decko';
import { Assistant } from '../assistant';

export class OptionAssistant extends Assistant {
  constructor () {
    super();
    this.state.options = [];
  }

  @bind
  onOptionChange (newOptions) {
    this.setState({options: newOptions});
  }

  @bind
  onUnboxedValueChangeAttempted (newUnboxedValue) {
    this.setState({
      unboxedValue: newUnboxedValue
    });
  }

  processProps (props) {
    if (this.state.machineState) this.state.machineState.removeListener(this.onOptionChange);
    if (this.state.machineState) this.state.machineState.removeListener(this.onUnboxedValueChangeAttempted);
    super.processProps(props);
    // TODO detach when component unmounts
    if (this.state.machineState) {
      this.state.machineState.on('unboxed value change attempted', this.onUnboxedValueChangeAttempted);
      this.state.machineState.on('options changed', this.onOptionChange);
      this.setState({
        options: this.state.machineState.template.options
      });
    }
    // TODO do we need to modify validation state?
  }

  renderInteractive (props, {valid, readOnly, options, unboxedValue}) {
    const val = unboxedValue === undefined ? unboxedValue = '' : unboxedValue.toLowerCase();
    const suggestions = options.filter(o => o.key.toLowerCase().startsWith(val)).slice(0, 10);
    return (
      <ul>
        { suggestions.map(o => <li>{o.key}</li>) }
      </ul>
    );
  }
}
