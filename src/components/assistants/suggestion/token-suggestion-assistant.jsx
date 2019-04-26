import { h } from 'preact';
import { ValueAssistant } from '../generic/value-assistant';

export class TokenSuggestionAssistant extends ValueAssistant {
  // override request transition to short-circuit token creation
  requestTransition () {
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
}
