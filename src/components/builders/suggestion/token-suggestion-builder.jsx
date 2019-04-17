import { h } from 'preact';
import { ValueBuilder } from '../generic/value-builder';

export class TokenSuggestionBuilder extends ValueBuilder {
  // override request transition to short-circuit token creation
  requestTransition () {
    this.commitTypedValue();
    if (this.isValid) {
      const toBind = this.value.meta.factory(this.value.meta.match);
      toBind[this.state.machineState.vkey] = this.value;
      this.requestEndAndCreateToken(toBind);
    }
  }

  renderReadOnly () {
    return null;
  }

  renderInteractive (props, {valid, readOnly, typedText, machineState}) {
    // this is a copy of renderInteractive from value-builder, without previewText
    const inputClass = `token-input ${valid ? 'active' : 'invalid'}`;
    return (
      <span>
        {machineState.isMultivalue && <span className='badge'>{machineState.archive.length}</span>}
        <span className='text-input'>
          <input type='text'
            spellCheck='false'
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
