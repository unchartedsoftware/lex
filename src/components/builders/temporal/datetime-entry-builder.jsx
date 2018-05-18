import { h } from 'preact';
import { Bind } from 'lodash-decorators';
import { Builder } from '../../builder';
import { TAB, ENTER, BACKSPACE, ESCAPE, normalizeKey } from '../../../lib/keys';
import { propsToState } from '../../../lib/util';

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
    propsToState(this, props, [
      {k: 'machineState', sk: 'typedText', transform: (v) => v.unboxedValue}
    ]);
    return super.processProps(props);
  }

  commitTypedValue () {
    if (this.machineState.previewValue) {
      this.machineState.value = this.machineState.previewValue;
    } else {
      this.unboxedValue = this.state.typedText;
    }
  }

  @Bind
  handleKeyDown (e) {
    let consumed = true;
    const nothingEntered = e.target.value === undefined || e.target.value === null || e.target.value.length === 0;
    const normalizedKey = normalizeKey(e);
    switch (normalizedKey) {
      case this.state.multivalueDelimiter:
        if (nothingEntered) {
          consumed = false;
          break;
        }
        consumed = this.machineState.isMultivalue;
        if (this.machineState.isMultivalue) {
          this.commitTypedValue();
          this.requestArchive();
        }
        break;
      case ENTER:
      case TAB:
        this.commitTypedValue();
        consumed = this.requestTransition({nextToken: normalizedKey === TAB}); // only consume the event if the transition succeeds
        break;
      case BACKSPACE:
        if (nothingEntered) {
          this.requestRewind();
        } else {
          consumed = false;
        }
        break;
      case ESCAPE:
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

  @Bind
  handleInput (e) {
    // assign typedText without re-rendering
    this.state.typedText = e.target.value;
    if (this.commitTimeout) {
      clearInterval(this.commitTimeout);
      this.commitTimeout = undefined;
    }
    this.commitTimeout = setTimeout(() => this.commitTypedValue(), 500);
  }

  focus () {
    if (this.textInput) {
      this.textInput.focus();
      // move cursor to end of input
      this.textInput.selectionStart = this.textInput.selectionEnd = this.textInput.value.length;
    }
  }

  @Bind
  clearPreview () {
    this.setState({
      previewText: ''
    });
  }


  @Bind
  beforeTransition () {
    this.commitTypedValue();
    if (this.state.typedText === undefined || this.state.typedText === null || this.state.typedText.length === 0) {
      if (this.archive.length > 0) {
        this.requestUnarchive();
      }
    }
  }

  @Bind
  onValueChanged (_1, _2, newUnboxedValue) {
    if (newUnboxedValue !== null && newUnboxedValue !== undefined) {
      this.setState({
        typedText: newUnboxedValue
      });
    }
  }

  @Bind
  onPreviewValueChanged (_1, _2, newUnboxedPreviewValue) {
    if (newUnboxedPreviewValue !== this.state.previewText) {
      this.setState({
        previewText: newUnboxedPreviewValue
      });
    }
  }

  @Bind
  onBlur (e) {
    if (this.machine.state === this.machineState) {
      const assistantBox = document.getElementById('lex-assistant-box');
      if (!e.relatedTarget || assistantBox === null || (!assistantBox.contains(e.relatedTarget) && !e.relatedTarget.getAttribute('data-date'))) {
        this.requestCancel();
      }
    } else {
      this.requestBlur(e);
    }
  }

  renderReadOnly (props, state) {
    if (this.machineState.value) {
      if (this.machineState.isMultivalue && this.archive.length > 0) {
        return (
          <span className={`token-input ${state.valid ? '' : 'invalid'} ${state.machineState.vkeyClass} ${state.machineState.rewindableClass}`} onMouseDown={this.requestRewindTo}>{this.machineState.unboxedValue} & {this.archive.length} others</span>
        );
      } else {
        return (
          <span className={`token-input ${state.valid ? '' : 'invalid'} ${state.machineState.vkeyClass} ${state.machineState.rewindableClass}`} onMouseDown={this.requestRewindTo}>{this.machineState.unboxedValue}</span>
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
            onMouseDown={this.clearPreview}
            value={typedText}
            placeholder={machineState.format}
            onInput={this.handleInput}
            onFocus={this.requestFocus}
            onFocusOut={this.onBlur}
            onPaste={this.onPaste}
            ref={(input) => { this.textInput = input; }}
            disabled={readOnly} />
        </span>
      </span>
    );
  }
}
