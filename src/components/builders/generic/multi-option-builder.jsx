import { h } from 'preact';
import linkState from 'linkstate';
import { bind } from 'decko';
import { Builder } from '../../builder';

/**
 * A visual interaction mechanism for supplying values
 * to an `MultiOptionState`. By default, this is registered as
 * the `Builder` for `MultiOptionState`s.
 *
 * @example
 * lex.registerBuilder(MultiOptionState, MultiOptionBuilder)
 */
export class MultiOptionBuilder extends Builder {
  constructor () {
    super();
    this.inProgressValue = null;
    this.state.options = [];
  }

  cleanupListeners () {
    super.cleanupListeners();
    if (this.machineState) {
      this.machineState.removeListener('options changed', this.onOptionsChanged);
      this.machineState.removeListener('value changed', this.onValueChanged);
    }
  }

  connectListeners () {
    super.connectListeners();
    this.machineState.on('options changed', this.onOptionsChanged);
    this.machineState.on('value changed', this.onValueChanged);
  }

  @bind
  handleKeyDown (e) {
    let consumed = true;
    const oldValue = this.unboxedValue;
    switch (e.code) {
      case 'Comma':
        this.unboxedValue = Array.isArray(this.unboxedValue) ? [...this.unboxedValue, e.target.value] : [e.target.value];
        if (this.state.machineState.isValid) {
          this.setState({typedText: ''}); // clear previous value and move on
        } else {
          // reset
          this.unboxedValue = oldValue;
        }
        console.log(this.value);
        break;
      case 'Enter':
      case 'Tab':
        if (e.target.value !== undefined && e.target.value !== null && e.target.value.length > 0) {
          this.unboxedValue = Array.isArray(this.unboxedValue) ? [...this.unboxedValue, e.target.value] : [e.target.value];
        }
        consumed = this.requestTransition(); // only consume the event if the transition succeeds
        if (!consumed) {
          // reset
          this.unboxedValue = oldValue;
        }
        break;
      case 'Backspace':
        if (e.target.value === undefined || e.target.value === null || e.target.value.length === 0) {
          if (this.value.length > 0) {
            // rewind to editing previous value
            const oldUnboxed = this.unboxedValue;
            this.unboxedValue = [...oldUnboxed.slice(0, oldUnboxed.length - 1)];
            this.setState({typedText: oldUnboxed[oldUnboxed.length - 1]});
          } else {
            this.requestRewind();
          }
        } else {
          consumed = false;
        }
        break;
      case 'Escape':
        this.requestCancel();
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
    this.machineState.template.refreshOptions(e.target.value);
  }

  focus () {
    if (this.textInput) this.textInput.focus();
  }

  @bind
  onOptionsChanged (newOptions) {
    this.setState({options: newOptions});
  }

  @bind
  onValueChanged (newValue) {
    if (newValue && newValue.length > 0) {
      this.setState({typedText: newValue[0].key});
    }
  }

  renderReadOnly (props, state) {
    if (this.machineState.value && this.machineState.value.length > 0) {
      return (
        <span className={state.valid ? 'token-input' : 'token-input invalid'}>{this.machineState.value.length} values</span>
      );
    } else {
      super.renderReadOnly(props, state);
    }
  }

  renderInteractive (props, {valid, readOnly, typedText}) {
    return (
      <span>
        <span className='badge'>{!Array.isArray(this.value) ? 0 : this.value.length}</span>
        <input type='text'
          className={valid ? 'token-input active' : 'token-input invalid'}
          onKeyDown={this.handleKeyDown}
          onKeyUp={this.handleKeyUp}
          value={typedText}
          onInput={linkState(this, 'typedText')}
          onFocus={this.requestFocus}
          onBlur={this.requestBlur}
          ref={(input) => { this.textInput = input; }}
          disabled={readOnly} />
      </span>
    );
  }
}
