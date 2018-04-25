import { h } from 'preact';
import { bind } from 'decko';
import { Builder } from '../../builder';
import { ENTER, TAB, BACKSPACE, ESCAPE, normalizeKey } from '../../../lib/keys';

/**
 * A visual interaction mechanism for supplying values
 * to an `OptionState`. By default, this is registered as
 * the `Builder` for `OptionState`s.
 *
 * @example
 * lex.registerBuilder(OptionState, OptionBuilder)
 */
export class OptionBuilder extends Builder {
  constructor () {
    super();
    this.state.options = [];
  }

  cleanupListeners () {
    super.cleanupListeners();
    if (this.machineState) {
      this.machineStateTemplate.removeListener('options changed', this.onOptionsChanged);
      this.machineState.removeListener('value changed', this.onValueChanged);
      this.machineState.removeListener('preview value changed', this.onPreviewValueChanged);
    }
  }

  connectListeners () {
    super.connectListeners();
    if (this.machineState) {
      this.machineStateTemplate.on('options changed', this.onOptionsChanged);
      this.machineState.on('value changed', this.onValueChanged);
      this.machineState.on('preview value changed', this.onPreviewValueChanged);
    }
  }

  componentWillMount () {
    super.componentWillMount();
    const boxed = this.machine.boxedValue;
    const {readOnly, machineState} = this.state;
    if (!readOnly && !machineState.isReadOnly) {
      // This builder isn't read only, we should tell our template to refresh its options
      this.machineStateTemplate.refreshOptions(this.machineStateTemplate.unformatUnboxedValue('', boxed), boxed, this.boxedArchive);
    }
  }

  processProps (props) {
    const { machine, machineState } = props;
    this.setState({
      typedText: machineState.unboxedValue ? machineState.template.formatUnboxedValue(machineState.unboxedValue, machine.boxedValue) : ''
    });
    return super.processProps(props);
  }

  commitTypedValue () {
    if (this.machineState.previewValue) {
      this.machineState.value = this.machineState.previewValue;
    } else if (this.state.typedText && this.state.typedText.length > 0) {
      this.unboxedValue = this.machineStateTemplate.unformatUnboxedValue(this.state.typedText, this.machine.boxedValue);
    }
  }

  @bind
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

  @bind
  handleKeyUp (e) {
    const boxed = this.machine.boxedValue;
    this.machineStateTemplate.refreshOptions(this.machineStateTemplate.unformatUnboxedValue(e.target.value, boxed), boxed, this.boxedArchive);
  }

  focus () {
    if (this.textInput) {
      this.textInput.focus();
      // move cursor to end of input
      this.textInput.selectionStart = this.textInput.selectionEnd = this.textInput.value.length;
    }
  }

  @bind
  clearPreview () {
    this.setState({
      previewText: ''
    });
  }

  @bind
  beforeTransition () {
    this.commitTypedValue();
    if (this.state.typedText === undefined || this.state.typedText === null || this.state.typedText.length === 0) {
      if (this.archive.length > 0) {
        this.requestUnarchive();
      }
    }
  }

  @bind
  onOptionsChanged (newOptions) {
    this.setState({options: newOptions});
  }

  @bind
  onValueChanged (newValue) {
    if (this.machineStateTemplate.allowUnknown) {
      this.setState({
        typedText: newValue ? this.machineStateTemplate.formatUnboxedValue(newValue.key, this.machine.boxedValue) : ''
      });
    } else if (newValue) {
      this.setState({
        typedText: this.machineStateTemplate.formatUnboxedValue(newValue.key, this.machine.boxedValue)
      });
    }
  }

  @bind
  onPreviewValueChanged (_1, _2, newUnboxedPreviewValue) {
    if (newUnboxedPreviewValue !== this.state.previewText) {
      this.setState({
        previewText: newUnboxedPreviewValue
      });
    }
  }

  @bind
  onBlur (e) {
    this.commitTypedValue();
    this.requestBlur(e);
  }

  @bind
  handleInput (e) {
    // assign typedText without re-rendering
    this.state.typedText = e.target.value;
  }

  @bind
  onPaste (e) {
    if (this.machineState.isMultivalue) {
      e.preventDefault();
      e.stopPropagation();
      const clipboardData = (e.clipboardData || window.clipboardData).getData('Text');
      const values = clipboardData.split(this.state.multivaluePasteDelimiter).map(e => e.trim());
      values.forEach(v => {
        this.machineState.unboxedValue = this.machineStateTemplate.unformatUnboxedValue(v, this.machine.boxedValue);
        this.requestArchive();
      });
    }
  }

  renderReadOnly (props, state) {
    const units = this.machineStateTemplate.units !== undefined ? <span className='text-muted'> { this.machineStateTemplate.units }</span> : '';
    if (this.machineState.value) {
      const shortKey = this.machineState.value.shortKey !== undefined ? this.machineState.value.shortKey : this.machineStateTemplate.formatUnboxedValue(this.machineState.value.key, this.machine.boxedValue);
      if (this.machineState.isMultivalue && this.archive.length > 0) {
        return (
          <span className={`token-input ${state.valid ? '' : 'invalid'} ${state.machineState.vkeyClass}`} onMouseDown={this.requestRewindTo}>{shortKey}{units} & {this.archive.length} others</span>
        );
      } else {
        return (
          <span className={`token-input ${state.valid ? '' : 'invalid'} ${state.machineState.vkeyClass}`} onMouseDown={this.requestRewindTo}>{shortKey}{units}</span>
        );
      }
    } else {
      super.renderReadOnly(props, state);
    }
  }

  renderInteractive (props, {valid, readOnly, typedText, previewText, machineState}) {
    const inputClass = `token-input ${valid ? 'active' : 'invalid'}`;
    return (
      <span>
        {machineState.isMultivalue && <span className='badge'>{machineState.archive.length}</span>}
        <span className='text-input'>
          <span className='text-muted preview'>{previewText}</span>
          <input type='text'
            className={inputClass}
            onKeyDown={this.handleKeyDown}
            onKeyUp={this.handleKeyUp}
            onMouseDown={this.clearPreview}
            value={typedText}
            onInput={this.handleInput}
            onFocus={this.requestFocus}
            onFocusOut={this.onBlur}
            onPaste={this.onPaste}
            ref={(input) => { this.textInput = input; }}
            disabled={readOnly || (machineState.isMultivalue && !machineState.canArchiveValue)} />
          { machineState.template.units !== undefined ? <span className='token-input token-input-units text-muted'>{ machineState.template.units }</span> : '' }
        </span>
      </span>
    );
  }
}
