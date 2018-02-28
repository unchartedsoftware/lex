import { h } from 'preact';
import { bind } from 'decko';
import { Assistant } from '../../assistant';

/**
 * A visual interaction mechanism for supplying values
 * to an `OptionState`. By default, this is registered as
 * the `Assistant` for `OptionState`s.
 *
 * @example
 * lex.registerAssistant(OptionState, OptionAssistant)
 */
export class OptionAssistant extends Assistant {
  constructor () {
    super();
    this.state.options = [];
    this.state.activeOption = -1;
    this.state.suggestions = [];
  }

  @bind
  onOptionsChanged (newOptions) {
    this.setState({
      options: newOptions,
      unboxedValue: undefined,
      activeOption: -1,
      suggestions: newOptions.slice(0, this.machineState.template.suggestionLimit)
    });
  }

  @bind
  onUnboxedValueChangeAttempted (newUnboxedValue = '') {
    const val = newUnboxedValue === null ? newUnboxedValue = '' : newUnboxedValue.toLowerCase();
    this.setState({
      unboxedValue: newUnboxedValue.toLowerCase(),
      suggestions: this.state.options.filter(o => o.displayKey.toLowerCase().startsWith(val)).slice(0, this.machineState.template.suggestionLimit)
    });
  }

  @bind
  onOptionSelected (option) {
    this.machineState.unboxedValue = option.displayKey;
    if (this.machineState.isMultivalue) {
      const result = this.requestArchive();
      if (result) {
        this.machineState.unboxedValue = null;
      }
    } else {
      this.requestTransition();
    }
  }

  @bind
  onArchivedRemoved (idx) {
    this.requestRemoveArchivedValue(idx);
  }

  processProps (props) {
    const oldMachineState = this.machineState;
    if (oldMachineState) oldMachineState.template.removeListener('options changed', this.onOptionsChanged);
    super.processProps(props);
    if (this.machineState !== oldMachineState) {
      this.setState({
        options: this.machineState.template.options,
        unboxedValue: undefined,
        activeOption: -1,
        suggestions: this.machineState.template.options.slice(0, this.machineState.template.suggestionLimit)
      });
    }
    if (this.machineState) this.machineState.template.on('options changed', this.onOptionsChanged);
  }

  connectListeners () {
    super.connectListeners();
    if (this.machineState) {
      // this.machineState.template.on('options changed', this.onOptionsChanged); // TODO not sure why this doesn't work here
      this.machineState.on('unboxed value change attempted', this.onUnboxedValueChangeAttempted);
    }
  }

  cleanupListeners () {
    super.cleanupListeners();
    if (this.machineState) {
      // this.machineState.template.removeListener('options changed', this.onOptionChanged); // TODO not sure why this doesn't work here
      this.machineState.removeListener('unboxed value change attempted', this.onUnboxedValueChangeAttempted);
    }
  }

  delegateEvent (e) {
    let consumed = true;
    switch (e.code) {
      case 'ArrowUp':
        this.setState({activeOption: Math.max(this.state.activeOption - 1, 0)});
        this.machineState.previewValue = this.state.suggestions[this.state.activeOption];
        break;
      case 'ArrowDown':
        this.setState({activeOption: Math.min(this.state.activeOption + 1, this.state.suggestions.length - 1)});
        this.machineState.previewValue = this.state.suggestions[this.state.activeOption];
        break;
      case this.state.multivalueDelimiter:
        if (this.machineState.isMultivalue) {
          consumed = true;
          this.machineState.value = this.state.suggestions[this.state.activeOption];
          this.requestArchive();
        }
        break;
      case 'Enter':
      case 'Tab':
        const activeOption = this.state.suggestions[this.state.activeOption];
        if (activeOption) {
          this.machineState.value = activeOption;
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

  renderArchive () {
    if (this.machineState.isMultivalue) {
      return (
        <div className='assistant-right'>
          <div className='assistant-header'>Entered Values</div>
          <ul>
            {
              this.machineState.archive.map((o, idx) => <li tabIndex='0' className='removable' onClick={() => this.onArchivedRemoved(idx)}>{o.displayKey}<em className='pull-right'>(click to remove)</em></li>)
            }
          </ul>
        </div>
      );
    }
  }

  renderInteractive (props, {activeOption, suggestions}) {
    if (!this.machineState.template.hasAsyncOptions && this.machineState.template.options.length === 0) return;
    return (
      <div className='assistant'>
        <div className='assistant-header'>
          {this.machineState.name}
          <span className='pull-right'>
            {this.machineState.isMultivalue && <span><strong>{this.state.multivalueDelimiter}</strong> to enter multiple values&nbsp;&nbsp;&nbsp;</span>}
            <strong>&#x21c5;</strong> to navigate&nbsp;&nbsp;&nbsp;
            <strong>Tab</strong> to {this.machineState.isMultivalue ? 'progress' : 'select'}
          </span>
        </div>
        <div className='assistant-body'>
          <div className={this.machineState.isMultivalue ? 'assistant-left' : ''}>
            { this.machineState.isMultivalue && <div className='assistant-header'>Suggestions</div>}
            <ul>
              {
                suggestions.map((o, idx) => <li tabIndex='0' onClick={() => this.onOptionSelected(o)} className={idx === activeOption ? 'selectable active' : 'selectable'}>{o.displayKey}</li>)
              }
              { (!suggestions || suggestions.length === 0) && <li><em className='text-muted'>No suggestions</em></li>}
            </ul>
          </div>
          {this.renderArchive(props)}
        </div>
      </div>
    );
  }
}
