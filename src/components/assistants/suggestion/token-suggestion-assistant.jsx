import { h } from 'preact';
import { Bind } from 'lodash-decorators';
import { ValueAssistant } from '../generic/value-assistant';
import { ValueStateValue } from '../../../lib/states/generic/value-state';

export class TokenSuggestionAssistant extends ValueAssistant {
  // override request transition to short-circuit token creation
  requestTransition () {
    try {
      const toBind = this.value.meta.factory(this.value.meta.match);
      toBind[this.state.machineState.vkey] = this.value;
      if (this.isValid) {
        this.requestEndAndCreateToken(toBind);
      }
    } catch (err) {
      this.state.machine.emit('state change failed', err); // a bit of a hack
    }
  }

  @Bind
  startAdvanced (e) {
    if (e) {
      e.stopPropagation();
      e.preventDefault();
    }
    this.value = new ValueStateValue('');
    super.requestTransition();
  }

  renderAssistantBody (props, {activeSuggestion, suggestions}) {
    if (Array.isArray(this.machineState.suggestions) && this.machineState.suggestions.length > 0) {
      return (
        <div className='assistant-body'>
          <div className=''>
            <ul ref={(n) => { this.suggestionContainer = n; }}>
              {
                (!this.machineState.isMultivalue || this.machineState.canArchiveValue) && (suggestions.map((o, idx) => <li key={o.key} tabIndex='0' onClick={() => this.onSuggestionSelected(o)} onMouseOver={() => this.onSuggestionOver(idx)} onMouseOut={this.onSuggestionOut} className={idx === activeSuggestion ? 'selectable active' : 'selectable'}>{this.machineState.formatUnboxedValue(o.key, this.machine.boxedValue)}</li>))
              }
              { (!this.machineState.isMultivalue || this.machineState.canArchiveValue) && (!suggestions || suggestions.length === 0) && <li><em className='text-muted'>No suggestions</em></li>}
              <li className='selectable hoverable' onMouseDown={this.startAdvanced}>More options...</li>
            </ul>
          </div>
        </div>
      );
    }
  }
}
