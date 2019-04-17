import { h } from 'preact';
import { ValueAssistant } from '../generic/value-assistant';

export class TokenSuggestionAssistant extends ValueAssistant {
  // override request transition to short-circuit token creation
  requestTransition () {
    if (this.isValid) {
      const toBind = this.value.meta.factory(this.value.meta.match);
      toBind[this.state.machineState.vkey] = this.value;
      this.requestEndAndCreateToken(toBind);
    }
  }
}
