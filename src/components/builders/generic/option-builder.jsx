import { h } from 'preact';
import { Bind, Debounce } from 'lodash-decorators';
import { Builder } from '../../builder';
import { ENTER, TAB, BACKSPACE, ESCAPE, normalizeKey } from '../../../lib/keys';
import { lexStillHasFocus } from '../../../lib/util';

/**
 * A visual interaction mechanism for supplying values
 * to an `OptionState`. By default, this is registered as
 * the `Builder` for `OptionState`s.
 *
 * @example
 * lex.registerBuilder(OptionState, OptionBuilder)
 */
export class OptionBuilder extends Builder {
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
    const { machine, machineState } = props;
    this.setState({
      typedText: machineState.unboxedValue ? machineState.formatUnboxedValue(machineState.unboxedValue, machine.boxedValue) : '',
      previewText: machineState.previewValue
    });

    return super.processProps(props);
  }

  commitTypedValue () {
    if (this.machineState.previewValue) {
      this.machineState.value = this.machineState.previewValue;
    } else if (this.state.typedText && this.state.typedText.length > 0) {
      this.unboxedValue = this.machineState.unformatUnboxedValue(this.state.typedText, this.machine.boxedValue);
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
      this.machineState.previewValue = null;
    }
  }

  @Bind
  @Debounce(250) // 250ms debounce
  handleKeyUp (e) {
    const boxed = this.machine.boxedValue;
    this.machineState.refreshSuggestions(this.machineState.unformatUnboxedValue(e.target.value, boxed), boxed);
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
    if (typeof this.state.previewText === 'string' && this.state.previewText.length > 0) {
      this.setState({
        previewText: null
      });
    }
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
  onValueChanged (newValue) {
    if (this.machineState.allowUnknown) {
      this.setState({
        typedText: newValue ? this.machineState.formatUnboxedValue(newValue.key, this.machine.boxedValue) : ''
      });
    } else if (newValue) {
      this.setState({
        typedText: this.machineState.formatUnboxedValue(newValue.key, this.machine.boxedValue)
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
    try { this.commitTypedValue(); } catch (err) { /* do nothing */ }
    if (this.machine.state === this.machineState && this.cancelOnBlur) {
      const assistantBox = document.getElementById('lex-assistant-box');
      if (!lexStillHasFocus(e, assistantBox)) {
        this.requestCancel();
      }
    } else {
      this.requestBlur(e);
    }
  }

  @Bind
  handleInput (e) {
    // assign typedText without re-rendering
    this.state.typedText = e.target.value;
  }

  @Bind
  onPaste (e) {
    if (this.machineState.isMultivalue) {
      e.preventDefault();
      e.stopPropagation();
      const clipboardData = (e.clipboardData || window.clipboardData).getData('Text');
      const values = clipboardData.split(this.state.multivaluePasteDelimiter).map(e => e.trim());
      values.forEach(v => {
        this.machineState.unboxedValue = this.machineState.unformatUnboxedValue(v, this.machine.boxedValue);
        this.requestArchive();
      });
    }
  }

  renderReadOnly (props, state) {
    const units = this.machineState.units !== undefined ? <span className='text-muted'> { this.machineState.units }</span> : '';
    if (this.machineState.value) {
      const shortKey = this.machineState.value.shortKey !== undefined ? this.machineState.value.shortKey : this.machineState.formatUnboxedValue(this.machineState.value.key, this.machine.boxedValue);
      if (this.machineState.isMultivalue && this.archive.length > 0) {
        return (
          <span className={`token-input ${state.valid ? '' : 'invalid'} ${state.machineState.vkeyClass} ${state.machineState.rewindableClass}`} onMouseDown={this.requestRewindTo}>{shortKey}{units} & {this.archive.length} others</span>
        );
      } else {
        return (
          <span className={`token-input ${state.valid ? '' : 'invalid'} ${state.machineState.vkeyClass} ${state.machineState.rewindableClass}`} onMouseDown={this.requestRewindTo}>{shortKey}{units}</span>
        );
      }
    } else {
      super.renderReadOnly(props, state);
    }
  }

  captureInputRef = (ref) => {
    this.textInput = ref;
  };

  renderInteractive (props, {valid, readOnly, typedText, previewText, machineState}) {
    const hasPreview = typeof previewText === 'string' && previewText.trim().length > 0;
    const inputClass = `token-input ${valid ? 'active' : 'invalid'} ${hasPreview ? 'has-preview' : ''}`;
    return (
      <span>
        {machineState.isMultivalue && <span className='badge'>{machineState.archive.length}</span>}
        <span className='text-input'>
          <span className='text-muted preview'>{previewText}</span>
          <input type='text'
            spellCheck='false'
            className={inputClass}
            onKeyDown={this.handleKeyDown}
            onKeyUp={this.handleKeyUp}
            onMouseDown={this.clearPreview}
            value={typedText}
            onInput={this.handleInput}
            onFocus={this.requestFocus}
            onFocusOut={this.onBlur}
            onPaste={this.onPaste}
            ref={this.captureInputRef}
            disabled={readOnly || (machineState.isMultivalue && !machineState.canArchiveValue)} />
          { machineState.units !== undefined ? <span className='token-input token-input-units text-muted'>{ machineState.units }</span> : '' }
        </span>
      </span>
    );
  }
}
