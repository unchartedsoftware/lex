import { h } from 'preact';
import linkState from 'linkstate';
import { bind } from 'decko';
import { Builder } from '../../builder';
import { ENTER, TAB, BACKSPACE, ESCAPE } from '../../../lib/keys';

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
    this.machineStateTemplate.refreshOptions(this.machineStateTemplate.unformatUnboxedValue(''), this.machine.boxedValue);
  }

  processProps (props) {
    const { machineState } = props;
    this.setState({
      typedText: machineState.unboxedValue ? machineState.template.formatUnboxedValue(machineState.unboxedValue) : ''
    });
    return super.processProps(props);
  }

  @bind
  handleKeyDown (e) {
    let consumed = true;
    const nothingEntered = e.target.value === undefined || e.target.value === null || e.target.value.length === 0;
    switch (e.keyCode) {
      case this.state.multivalueDelimiter:
        if (nothingEntered) {
          consumed = false;
          break;
        }
        consumed = this.machineState.isMultivalue;
        if (this.machineState.isMultivalue) {
          if (this.machineState.previewValue) this.machineState.value = this.machineState.previewValue;
          this.requestArchive();
        }
        break;
      case ENTER:
      case TAB:
        if (nothingEntered) {
          // if nothing is entered, but the archive has values, we can still request a transition
          // unarchive most recent value and request.
          if (this.archive.length === 0) {
            consumed = false;
            break;
          } else {
            this.requestUnarchive();
          }
        }
        if (this.machineState.previewValue) {
          this.value = this.machineState.previewValue;
        } else {
          this.unboxedValue = this.machineStateTemplate.unformatUnboxedValue(e.target.value);
        }
        consumed = this.requestTransition({nextToken: e.keyCode === TAB}); // only consume the event if the transition succeeds
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
    this.machineStateTemplate.refreshOptions(this.machineStateTemplate.unformatUnboxedValue(e.target.value), this.machine.boxedValue);
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
    this.unboxedValue = this.machineStateTemplate.unformatUnboxedValue(this.state.typedText);
  }

  @bind
  onOptionsChanged (newOptions) {
    this.setState({options: newOptions});
  }

  @bind
  onValueChanged (newValue) {
    if (this.machineStateTemplate.allowUnknown) {
      this.setState({
        typedText: newValue ? this.machineStateTemplate.formatUnboxedValue(newValue.key) : ''
      });
    } else if (newValue) {
      this.setState({
        typedText: this.machineStateTemplate.formatUnboxedValue(newValue.key)
      });
    }
  }

  @bind
  onPreviewValueChanged (_1, _2, newUnboxedPreviewValue) {
    this.setState({
      previewText: newUnboxedPreviewValue
    });
  }

  @bind
  onPaste (e) {
    if (this.machineState.isMultivalue) {
      e.preventDefault();
      e.stopPropagation();
      const clipboardData = (e.clipboardData || window.clipboardData).getData('Text');
      const values = clipboardData.split(this.state.multivaluePasteDelimiter).map(e => e.trim());
      values.forEach(v => {
        this.machineState.unboxedValue = this.machineStateTemplate.unformatUnboxedValue(v);
        this.requestArchive();
      });
    }
  }

  renderReadOnly (props, state) {
    const units = this.machineStateTemplate.units !== undefined ? <span className='text-muted'> { this.machineStateTemplate.units }</span> : '';
    if (this.machineState.value) {
      const shortKey = this.machineState.value.shortKey !== undefined ? this.machineState.value.shortKey : this.machineStateTemplate.formatUnboxedValue(this.machineState.value.key);
      if (this.machineState.isMultivalue && this.archive.length > 0) {
        return (
          <span className={state.valid ? 'token-input' : 'token-input invalid'}>{shortKey}{units} & {this.archive.length} others</span>
        );
      } else {
        return (
          <span className={state.valid ? 'token-input' : 'token-input invalid'}>{shortKey}{units}</span>
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
            onInput={linkState(this, 'typedText')}
            onFocus={this.requestFocus}
            onFocusOut={this.requestBlur}
            onPaste={this.onPaste}
            ref={(input) => { this.textInput = input; }}
            disabled={readOnly} />
          { machineState.template.units !== undefined ? <span className='token-input token-input-units text-muted'>{ machineState.template.units }</span> : '' }
        </span>
      </span>
    );
  }
}
