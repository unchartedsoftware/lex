// test dependencies
import { expect } from 'chai';
// system under test
import { TokenStateMachine } from '../../../src/lib/token-state-machine';
import { OptionState, OptionStateOption } from '../../../src/lib/states/generic/option-state';
import { NumericRelationState } from '../../../src/lib/states/numeric/numeric-relation-state';
import { NumericEntryState } from '../../../src/lib/states/numeric/numeric-entry-state';
import { TextEntryState } from '../../../src/lib/states/text/text-entry-state';
import { lexFrom } from '../../../src/lib/lex-util';
import { TransitionFactory } from '../../../src/lib/transition-factory';
import { LabelState } from '../../../src/lib/states/generic/label-state';

describe('TokenStateMachine', () => {
  describe('transition', () => {
    it('Walks a simple tree', () => {
      // Given a simple language
      const optFirstName = new OptionStateOption('First Name');
      const optLastName = new OptionStateOption('Last Name');
      const language = lexFrom('field', OptionState, {
        name: 'Choose a field to search',
        options: [optFirstName, optLastName]
      })
        .to('value', TextEntryState);

      // When machine is initialized with language root
      const tokenStateMachine = new TokenStateMachine(language.root);

      // Then verify expected root state
      expect(tokenStateMachine.id).to.be.finite;
      expect(tokenStateMachine.rootState.name).to.equal('Choose a field to search');
      expect(tokenStateMachine.rootState.vkey).to.equal('field');

      // Given a valid initial state -> pick First Name option
      tokenStateMachine.rootState.options = [optFirstName, optLastName];
      tokenStateMachine.rootState.value = optFirstName;

      // When transition is invoked
      tokenStateMachine.transition();

      // Then verify current state
      expect(tokenStateMachine.state.name).to.equal('Enter a value');
      expect(tokenStateMachine.state.vkey).to.equal('value');

      // Given a value is entered
      tokenStateMachine.state.value = {key: 'Joe'};

      // When another transition is invoked
      tokenStateMachine.transition();

      // Then expect to be in terminal state
      expect(tokenStateMachine.state.isTerminal).to.be.true;
      expect(tokenStateMachine.value.field.key).to.equal('First Name');
      expect(tokenStateMachine.value.value.key).to.equal('Joe');
    });

    it('Walks a tree with branches', () => {
      // Given a language with branches
      const optAge = new OptionStateOption('Age');
      const optHeight = new OptionStateOption('Height');
      const language = lexFrom('field', OptionState, {
        name: 'Choose a field to search',
        options: [optAge, optHeight]
      })
        .branch(
          lexFrom('relation', NumericRelationState)
            .branch(
              lexFrom('value', NumericEntryState, TransitionFactory.optionKeyIsNot('between')),
              lexFrom('value', NumericEntryState, TransitionFactory.optionKeyIs('between')).to(LabelState, {label: 'and'}).to('secondaryValue', NumericEntryState)
            )
        );

      // When machine is initialized with language root
      const tokenStateMachine = new TokenStateMachine(language.root);

      // Then verify expected root state
      expect(tokenStateMachine.id).to.be.finite;
      expect(tokenStateMachine.rootState.name).to.equal('Choose a field to search');
      expect(tokenStateMachine.rootState.vkey).to.equal('field');

      // Given a valid initial state -> pick Height option
      tokenStateMachine.rootState.options = [optAge, optHeight];
      tokenStateMachine.rootState.value = optHeight;

      // When transition is invoked
      tokenStateMachine.transition();

      // Then verify current state
      expect(tokenStateMachine.state.name).to.equal('Choose a numeric relation');
      expect(tokenStateMachine.state.vkey).to.equal('relation');

      // Given a relation has been chosen
      tokenStateMachine.state.options = [{key: 'between', shortKey: 'between'}, {key: 'equals', shortKey: '='}];
      tokenStateMachine.state.value = {key: 'between'};

      // When another transition is invoked
      tokenStateMachine.transition();

      // Then verify current state
      expect(tokenStateMachine.state.name).to.equal('Enter a value');
      expect(tokenStateMachine.state.vkey).to.equal('value');

      // Given a value is entered
      tokenStateMachine.state.value = {key: 60};

      // When another transition is invoked
      tokenStateMachine.transition();

      // Then verify current state
      expect(tokenStateMachine.state.name).to.equal('Enter a value');
      expect(tokenStateMachine.state.vkey).to.equal('secondaryValue');

      // Given a secondary value is entered
      tokenStateMachine.state.value = {key: 65};

      // When another transition is invoked
      tokenStateMachine.transition();

      // Then expect to be in terminal state
      expect(tokenStateMachine.state.isTerminal).to.be.true;
      expect(tokenStateMachine.value.field.key).to.equal('Height');
      expect(tokenStateMachine.value.relation.key).to.equal('between');
      expect(tokenStateMachine.value.value.key).to.equal(60);
      expect(tokenStateMachine.value.secondaryValue.key).to.equal(65);
    });
  });
});
