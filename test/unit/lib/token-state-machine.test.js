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
      const opt1 = new OptionStateOption('First Name');
      const opt2 = new OptionStateOption('Last Name');
      const st = new StateTemplate(OptionState, {
        name: 'Choose a field to search',
        options: [ opt1, opt2 ],
        vkey: 'field'
      });
      const language = st.to('value', TextEntryState);
      // When
      const tokenStateMachine = new TokenStateMachine(language.root);
      // Then
      expect(tokenStateMachine).to.not.be.undefined;
      expect(tokenStateMachine.id).to.be.finite;
      expect(tokenStateMachine.rootState.name).to.equal('Choose a field to search');
    });
  });
});
