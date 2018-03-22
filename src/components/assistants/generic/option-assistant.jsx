import { h } from 'preact';
import { bind } from 'decko';
import { Assistant } from '../../assistant';
import { UP_ARROW, DOWN_ARROW, TAB, ENTER } from '../../../lib/keys';
import { toChar } from '../../../lib/string-util';

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
      activeOption: -1,
      suggestions: newOptions.filter(o => !o.hidden).slice(0, this.machineStateTemplate.suggestionLimit)
    });
  }

  @bind
  onOptionSelected (option) {
    this.machineState.unboxedValue = option.key;
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
  onOptionHover (idx) {
    this.setState({activeOption: idx});
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
        options: this.machineStateTemplate.options,
        activeOption: -1,
        suggestions: this.machineStateTemplate.options.filter(o => !o.hidden).slice(0, this.machineStateTemplate.suggestionLimit)
      });
    }
    if (this.machineState) this.machineStateTemplate.on('options changed', this.onOptionsChanged);
  }

  delegateEvent (e) {
    let consumed = true;
    switch (e.keyCode) {
      // Fallthrough case to handle IE
      case UP_ARROW:
        this.setState({activeOption: Math.max(this.state.activeOption - 1, 0)});
        this.machineState.previewValue = this.state.suggestions[this.state.activeOption];
        break;
      // Fallthrough case to handle IE
      case DOWN_ARROW:
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
      case ENTER:
      case TAB:
        const activeOption = this.state.suggestions[this.state.activeOption];
        if (activeOption) {
          this.machineState.value = activeOption;
          this.requestTransition();
        } else if (this.state.suggestions.length === 1 && !this.machineState.allowUnknown) {
          this.machineState.value = this.state.suggestions[0];
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
              this.machineState.archive.map((o, idx) => <li tabIndex='0' className='removable' onClick={() => this.onArchivedRemoved(idx)}>{this.machineStateTemplate.formatUnboxedValue(o.key)}<em className='pull-right'>(click to remove)</em></li>)
            }
          </ul>
        </div>
      );
    }
  }

  renderInteractive (props, {activeOption, suggestions}) {
    if (!this.machineState.isMultivalue && this.machineStateTemplate.options.length === 0) {
      return;
    }
    return (
      <div className='assistant'>
        <div className='assistant-header'>
          {this.machineState.name}
          <span className='pull-right'>
            {this.machineState.isMultivalue && <span><strong>{toChar(this.state.multivalueDelimiter)}</strong> to enter multiple values&nbsp;&nbsp;&nbsp;</span>}
            <strong>&#x21c5;</strong> to navigate&nbsp;&nbsp;&nbsp;
            <strong>Tab</strong> to {this.machineState.isMultivalue ? 'progress' : 'select'}
          </span>
        </div>
        <div className='assistant-body'>
          <div className={this.machineState.isMultivalue ? 'assistant-left' : ''}>
            { this.machineState.isMultivalue && <div className='assistant-header'>Suggestions</div>}
            <ul>
              {
                suggestions.map((o, idx) => <li tabIndex='0' onClick={() => this.onOptionSelected(o)} onMouseOver={() => this.onOptionHover(idx)} className={idx === activeOption ? 'selectable active' : 'selectable'}>{this.machineStateTemplate.formatUnboxedValue(o.key)}</li>)
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
