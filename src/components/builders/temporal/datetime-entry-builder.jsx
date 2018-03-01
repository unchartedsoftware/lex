import { h } from 'preact';
import linkState from 'linkstate';
import { bind } from 'decko';
import { Builder } from '../../builder';

/**
 * A visual interaction mechanism for supplying values
 * to an `DateTimeEntryState`. By default, this is registered as
 * the `Builder` for `DateTimeEntryState`s.
 *
 * @example
 * lex.registerBuilder(DateTimeEntryState, DateTimeEntryBuilder)
 */
export class DateTimeEntryBuilder extends Builder {
  constructor () {
    super();
    this.state.options = [];
  }

  cleanupListeners () {
    super.cleanupListeners();
    if (this.machineState) {
      this.machineState.removeListener('value changed', this.onValueChanged);
      this.machineState.removeListener('preview value changed', this.onPreviewValueChanged);
    }
  }

  connectListeners () {
    super.connectListeners();
    if (this.machineState) {
      this.machineState.on('value changed', this.onValueChanged);
      this.machineState.on('preview value changed', this.onPreviewValueChanged);
    }
  }

  processProps (props) {
    const { machineState } = props;
    if (machineState !== this.state.machineState) {
      this.setState({
        typedText: machineState.unboxedValue
      });
    }
    return super.processProps(props);
  }

  @bind
  handleKeyDown (e) {
    let consumed = true;
    this.unboxedValue = e.target.value;

    const isMultiValueDelimiter = this.state.multivalueDelimiterKeys.indexOf(e.code) > -1;

    if (this.machineState.isMultivalue && isMultiValueDelimiter) {
      if (e.target.value === undefined || e.target.value === null || e.target.value.length === 0) {
        consumed = false;
      } else {
        consumed = this.machineState.isMultivalue;
        if (this.machineState.isMultivalue) {
          if (this.machineState.previewValue) this.machineState.value = this.machineState.previewValue;
          this.requestArchive();
        }
      }
    }

    switch (e.code) {
      case 'Enter':
      case 'Tab':
        if (e.target.value === undefined || e.target.value === null || e.target.value.length === 0) {
          // if nothing is entered, but the archive has values, we can still request a transition
          // unarchive most recent value and request.
          if (this.archive.length === 0) {
            consumed = false;
            break;
          } else {
            this.requestUnarchive();
          }
        }
        if (this.machineState.previewValue) this.machineState.value = this.machineState.previewValue;
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
        this.requestCancel();
        break;
      default:
        consumed = false;
    }
    if (consumed) {
      e.stopPropagation();
      e.preventDefault();
    } else {
      // if we didn't consume the key, it must be text so clear the preview value
      this.machineState.previewValue = undefined;
    }
  }

  @bind
  handleKeyUp (e) {
    this.unboxedValue = e.target.value;
  }

  focus () {
    if (this.textInput) {
      this.textInput.focus();
      // move cursor to end of input
      this.textInput.selectionStart = this.textInput.selectionEnd = this.textInput.value.length;
    }
  }

  @bind
  onValueChanged (_1, _2, newUnboxedValue) {
    this.setState({
      typedText: newUnboxedValue !== null && newUnboxedValue !== undefined ? newUnboxedValue : ''
    });
  }

  @bind
  onPreviewValueChanged (_1, _2, newUnboxedPreviewValue) {
    this.setState({
      previewText: newUnboxedPreviewValue
    });
  }

  renderReadOnly (props, state) {
    if (this.machineState.value) {
      if (this.machineState.isMultivalue && this.archive.length > 0) {
        return (
          <span className={state.valid ? 'token-input' : 'token-input invalid'}>{this.machineState.unboxedValue} & {this.archive.length} others</span>
        );
      } else {
        return (
          <span className={state.valid ? 'token-input' : 'token-input invalid'}>{this.machineState.unboxedValue}</span>
        );
      }
    } else {
      super.renderReadOnly(props, state);
    }
  }

  renderInteractive (props, {valid, readOnly, typedText, previewText, machineState}) {
    return (
      <span>
        {machineState.isMultivalue && <span className='badge'>{machineState.archive.length}</span>}
        <span className='text-input'>
          <span className='text-muted preview'>{previewText}</span>
          <input type='text'
            className={valid ? 'token-input active' : 'token-input invalid'}
            onKeyDown={this.handleKeyDown}
            onKeyUp={this.handleKeyUp}
            value={typedText}
            placeholder={machineState.template.format}
            onInput={linkState(this, 'typedText')}
            onFocus={this.requestFocus}
            onBlur={this.requestBlur}
            onPaste={this.onPaste}
            ref={(input) => { this.textInput = input; }}
            disabled={readOnly} />
        </span>
      </span>
    );
  }
}
