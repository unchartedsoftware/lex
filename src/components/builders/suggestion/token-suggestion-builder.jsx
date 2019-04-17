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
}
