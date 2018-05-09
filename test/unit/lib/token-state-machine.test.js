// test dependencies
import { expect } from 'chai';
// system under test
import { TokenStateMachine } from '../../../src/lib/token-state-machine';
import { StateTemplate } from '../../../src/lib/state';
import { OptionState, OptionStateOption } from '../../../src/lib/states/generic/option-state';
import { TextEntryState } from '../../../src/lib/states/text/text-entry-state';

describe('TokenStateMachine', () => {
  describe('transition', () => {
    it('Walks a simple tree', () => {
      // Given a simple language
      const opt1 = new OptionStateOption('First Name');
      const opt2 = new OptionStateOption('Last Name');
      const stateTemplate = new StateTemplate(OptionState, {
        name: 'Choose a field to search',
        options: [opt1, opt2],
        vkey: 'field'
      });
      const language = stateTemplate.to('value', TextEntryState, {name: 'Enter a string'});

      // When machine is initialized with language root
      const tokenStateMachine = new TokenStateMachine(language.root);

      // Then verify expected root state
      expect(tokenStateMachine.id).to.be.finite;
      expect(tokenStateMachine.rootState.name).to.equal('Choose a field to search');
      expect(tokenStateMachine.rootState.vkey).to.equal('field');

      // Given a valid initial state
      tokenStateMachine.rootState.options = [opt1, opt2];
      tokenStateMachine.rootState.value = opt1;

      // When transition is invoked
      tokenStateMachine.transition();

      // Then verify current state
      expect(tokenStateMachine.state.name).to.equal('Enter a string');
      expect(tokenStateMachine.state.vkey).to.equal('value');

      // Ensure nextState is valid
      tokenStateMachine.state.value = {key: 'Joe'};

      // When another transition is invoked
      tokenStateMachine.transition();

      // Expect to be in terminal state
      expect(tokenStateMachine.state.isTerminal).to.be.true;
    });
  });
});
