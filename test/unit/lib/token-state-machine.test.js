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
      // Given
      const stateTemplate = new StateTemplate(OptionState, {
        name: 'Choose a field to search',
        options: [
          new OptionStateOption('First Name'),
          new OptionStateOption('Last Name') ],
        vkey: 'field'
      });
      const language = stateTemplate.to('value', TextEntryState);
      // When
      const tokenStateMachine = new TokenStateMachine(language.root);
      // Then
      expect(tokenStateMachine).to.not.be.undefined;
      expect(tokenStateMachine.id).to.be.finite;
      expect(tokenStateMachine.rootState.name).to.equal('Choose a field to search');
    });
  });
});
