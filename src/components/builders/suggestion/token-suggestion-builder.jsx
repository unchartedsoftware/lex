import { h } from 'preact';
import { Bind } from 'lodash-decorators';
import { ValueBuilder } from '../generic/value-builder';
import { ValueStateValue } from '../../../lex';

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

  @Bind
  startAdvanced (e) {
    if (e) {
      e.stopPropagation();
      e.preventDefault();
    }
    this.value = new ValueStateValue('');
    this.skipNextBlur = true;
    super.requestTransition();
  }

  @Bind
  requestRewindTo (e) {
    if (e) {
      e.stopPropagation();
      e.preventDefault();
    }
    this.skipNextBlur = true;
    super.requestRewindTo(e);
  }

  @Bind
  onBlur (e) {
    if (!this.skipNextBlur) {
      super.onBlur(e);
    }
    this.skipNextBlur = false;
  }

  renderReadOnly (props, {tokenActive, editing}) {
    if (tokenActive && !editing) {
      return (<button type='button' onMouseDown={this.requestRewindTo} className='btn btn-xs btn-default token-next' aria-label='Simple Search'>Simple</button>);
    }
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
        <button type='button' onMouseDown={this.startAdvanced} className='btn btn-xs btn-default token-next' aria-label='Advanced Search'>Advanced</button>
      </span>
    );
  }
}
