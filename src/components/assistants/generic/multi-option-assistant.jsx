import { h } from 'preact';
import { bind } from 'decko';
import { Assistant } from '../../assistant';

/**
 * A visual interaction mechanism for supplying values
 * to an `MultiOptionState`. By default, this is registered as
 * the `Assistant` for `MultiOptionState`s.
 *
 * @example
 * lex.registerAssistant(MultiOptionState, MultiOptionAssistant)
 */
export class MultiOptionAssistant extends Assistant {
  constructor () {
    super();
    this.state.options = [];
    this.state.activeOption = -1;
    this.state.suggestions = [];
  }

  @bind
  onOptionsChange (newOptions) {
    this.setState({
      options: newOptions,
      unboxedValue: undefined,
      activeOption: -1,
      suggestions: newOptions.slice(0, 10)
    });
  }

  @bind
  onUnboxedValueChangeAttempted (newUnboxedValue) {
    const val = Array.isArray(newUnboxedValue) ? (newUnboxedValue[0] ? newUnboxedValue[0].toLowerCase() : ['']) : newUnboxedValue = [''];
    this.setState({
      unboxedValue: newUnboxedValue,
      suggestions: this.state.options.filter(o => o.key.toLowerCase().startsWith(val)).slice(0, 10)
    });
  }

  @bind
  onOptionSelected (key) {
    this.machineState.unboxedValue = Array.isArray(this.machineState.unboxedValue) ? [...this.machineState.unboxedValue, key] : [key];
    this.requestTransition();
  }

  @bind
  removeValue (idx) { // eslint-disable-line
    console.log('TODO implement value removal');
  }

  processProps (props) {
    this.cleanupListeners();
    super.processProps(props);
    if (this.machineState) {
      this.machineState.on('options changed', this.onOptionsChange);
      this.machineState.on('unboxed value change attempted', this.onUnboxedValueChangeAttempted);
      this.setState({
        options: this.machineState.template.options,
        unboxedValue: undefined,
        activeOption: -1,
        suggestions: this.machineState.template.options.slice(0, 10)
      });
    }
    // TODO do we need to modify validation state?
  }

  cleanupListeners () {
    if (this.machineState) {
      this.machineState.removeListener('options changed', this.onOptionChange);
      this.machineState.removeListener('unboxed value change attempted', this.onUnboxedValueChangeAttempted);
    }
  }

  componentWillUnmount () {
    this.cleanupListeners();
  }

  delegateEvent (e) {
    let consumed = true;
    switch (e.code) {
      case 'ArrowUp':
        this.setState({activeOption: Math.max(this.state.activeOption - 1, 0)});
        break;
      case 'ArrowDown':
        this.setState({activeOption: Math.min(this.state.activeOption + 1, this.state.suggestions.length - 1)});
        break;
      case 'Enter':
      case 'Tab':
        const activeOption = this.state.suggestions[this.state.activeOption];
        if (activeOption) {
          this.machineState.value = Array.isArray(this.machineState.value) ? [...this.machineState.value, activeOption] : [activeOption];
          this.requestTransition();
        }
        break;
      default:
        consumed = true;
        break;
    }
    if (consumed) {
      e.stopPropagation();
      e.preventDefault();
    }
    return consumed;
  }

  renderInteractive (props, {activeOption, suggestions}) {
    return (
      <div>
        <div className='assistant-header'>
          {this.machineState.name}
          <span className='pull-right'><strong>&#129045;&#129047;</strong> to navigate suggestions&nbsp;&nbsp;&nbsp;<strong>Tab</strong> to select</span>
        </div>
        <div className='assistant-body'>
          <ul>
            {
              suggestions.map((o, idx) => <li tabIndex='0' onClick={() => this.onOptionSelected(o.key)} className={idx === activeOption ? 'active' : ''}>{o.key}</li>)
            }
          </ul>
          {
            Array.isArray(this.value) && this.value.length > 0 && <div className='assistant-header'>Entered Values</div>
          }
          <ul className='entered-values'>
            {
              Array.isArray(this.value) && this.value.map((o, idx) => <li tabIndex='0' onClick={() => this.removeValue(idx)}>{o.key}<span className='text-muted pull-right'>(click to remove)</span></li>)
            }
          </ul>
        </div>
      </div>
    );
  }
}
