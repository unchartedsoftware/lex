import { h } from 'preact';
import { Bind } from 'lodash-decorators';
import { ValueBuilder } from '../generic/value-builder';
import { ValueStateValue } from '../../../lib/states/generic/value-state';

export class TokenSuggestionBuilder extends ValueBuilder {
  // override request transition to short-circuit token creation
  requestTransition () {
    this.commitTypedValue();
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
  onTransitionFailed (reason) {
    this.value = new ValueStateValue('');
    this.setState({typedText: ''});
    super.onTransitionFailed(reason);
  }

  @Bind
  onBlur (e) {
    if (!this.skipNextBlur) {
      super.onBlur(e);
    }
    this.skipNextBlur = false;
  }

  renderReadOnly () {
    return null;
  }

  renderInteractive (props, {valid, readOnly, typedText, machineState}) {
    // this is a copy of renderInteractive from value-builder, without previewText
    const inputClass = `token-input ${valid ? 'active' : 'invalid'}`;
    return (
      <span>
        <span className='text-input'>
          <input type='text'
            spellCheck='false'
            autoComplete='false'
            className={inputClass}
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
