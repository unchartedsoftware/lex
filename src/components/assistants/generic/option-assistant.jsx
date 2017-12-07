import { bind } from 'decko';
import { Assistant } from '../../assistant';

export class OptionAssistant extends Assistant {
  constructor () {
    super();
    this.state.options = [];
    this.state.activeOption = -1;
  }

  @bind
  onOptionChange (newOptions) {
    this.setState({
      options: newOptions,
      unboxedValue: undefined
    });
  }

  @bind
  onUnboxedValueChangeAttempted (newUnboxedValue) {
    this.setState({
      unboxedValue: newUnboxedValue
    });
  }

  @bind
  onOptionSelected (key) {
    this.state.machineState.unboxedValue = key;
    this.requestTransition();
  }

  processProps (props) {
    this.cleanupListeners();
    super.processProps(props);
    if (this.state.machineState) {
      this.state.machineState.on('options changed', this.onOptionChange);
      this.state.machineState.on('unboxed value change attempted', this.onUnboxedValueChangeAttempted);
      this.setState({
        options: this.state.machineState.template.options,
        unboxedValue: undefined
      });
    }
    // TODO do we need to modify validation state?
  }

  cleanupListeners () {
    if (this.state.machineState) {
      this.state.machineState.removeListener('options changed', this.onOptionChange);
      this.state.machineState.removeListener('unboxed value change attempted', this.onUnboxedValueChangeAttempted);
    }
  }

  componentWillUnmount () {
    this.cleanupListeners();
  }

  delegateEvent (e) {
    switch (e.code) {
      case 'ArrowUp':
        this.setState({activeOption: Math.max(this.state.activeOption - 1, 0)});
        break;
      case 'ArrowDown':
        this.setState({activeOption: Math.min(this.state.activeOption + 1, this.state.options.length - 1)});
        break;
      case 'Tab':
        const activeOption = this.state.options[this.state.activeOption];
        if (activeOption) {
          this.state.machineState.value = activeOption;
          this.requestTransition();
        }
    }
  }

  renderInteractive (props, {valid, readOnly, options, unboxedValue, activeOption}) {
    const val = unboxedValue === undefined ? unboxedValue = '' : unboxedValue.toLowerCase();
    const suggestions = options.filter(o => o.key.toLowerCase().startsWith(val)).slice(0, 10);
    return (
      <div>
        <div className='assistant-header'>
          {this.state.machineState.name}
          <span className='pull-right'><strong>&#129045;&#129047;</strong> to navigate&nbsp;&nbsp;&nbsp;<strong>Tab</strong> to select</span>
        </div>
        <div className='assistant-body'>
          <ul>
            { suggestions.map((o, idx) => <li onClick={() => this.onOptionSelected(o.key)} className={idx === activeOption ? 'active' : ''}>{o.key}</li>) }
          </ul>
        </div>
      </div>
    );
  }
}
