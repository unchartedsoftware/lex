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
import { TerminalState } from '../../../src/lib/states/generic/terminal-state';
import { StateTransitionError } from '../../../src/lib/errors';

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

    it('Transitions to terminal state for terminal option', () => {
      // Given a language with a terminal option
      const optName = new OptionStateOption('Name', {type: 'string'});
      const optTerminal = new OptionStateOption('Terminal', {type: 'terminal'});
      const language = lexFrom('field', OptionState, {
        name: 'Choose a field to search',
        // One option will immediately end the token, the other will not.
        options: [optName, optTerminal]
      })
        .branch(
          lexFrom('value', TextEntryState, TransitionFactory.optionMetaCompare({type: 'string'})),
          lexFrom('terminal', TerminalState, TransitionFactory.optionMetaCompare({type: 'terminal'}))
        );

      // When machine is initialized with language root
      const tokenStateMachine = new TokenStateMachine(language.root);

      // Then verify expected root state
      expect(tokenStateMachine.id).to.be.finite;
      expect(tokenStateMachine.rootState.name).to.equal('Choose a field to search');
      expect(tokenStateMachine.rootState.vkey).to.equal('field');

      // Given a valid initial state -> pick Terminal option
      tokenStateMachine.rootState.options = [optName, optTerminal];
      tokenStateMachine.rootState.value = optTerminal;

      // When transition is invoked
      tokenStateMachine.transition();

      // Then expect to be in terminal state
      expect(tokenStateMachine.state.isTerminal).to.be.true;
      expect(tokenStateMachine.value.field.key).to.equal('Terminal');
      expect(tokenStateMachine.value.value).to.be.undefined;
    });

    it('Does not transition when in an invalid state', () => {
      // Given a language with a numeric option
      const optAge = new OptionStateOption('Age');
      const language = lexFrom('field', OptionState, {
        name: 'Choose a field to search',
        options: [optAge]
      })
        .to('value', NumericEntryState);

      // When machine is initialized with language root
      const tokenStateMachine = new TokenStateMachine(language.root);

      // Then verify expected root state
      expect(tokenStateMachine.id).to.be.finite;
      expect(tokenStateMachine.rootState.name).to.equal('Choose a field to search');
      expect(tokenStateMachine.rootState.vkey).to.equal('field');

      // Given a valid initial state -> pick First Name option
      tokenStateMachine.rootState.options = [optAge];
      tokenStateMachine.rootState.value = optAge;

      // When transition is invoked
      tokenStateMachine.transition();

      // Then verify current state
      expect(tokenStateMachine.state.name).to.equal('Enter a value');
      expect(tokenStateMachine.state.vkey).to.equal('value');

      // Given an invalid value is entered
      tokenStateMachine.state.value = {key: 'not a number'};

      // Then will fail to transition
      expect(tokenStateMachine.transition.bind(tokenStateMachine)).to.throw(StateTransitionError);
    });
  });

  describe('rewind', () => {
    it('Returns to previous state', () => {
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

      // Given entry of: Age between 5 and
      const tokenStateMachine = new TokenStateMachine(language.root);
      tokenStateMachine.rootState.options = [optAge, optHeight];
      tokenStateMachine.rootState.value = optAge;
      tokenStateMachine.transition();
      tokenStateMachine.state.options = [{key: 'between', shortKey: 'between'}, {key: 'equals', shortKey: '='}];
      tokenStateMachine.state.value = {key: 'between'};
      tokenStateMachine.transition();
      tokenStateMachine.state.value = {key: 5};
      tokenStateMachine.transition();

      // When
      tokenStateMachine.rewind();

      // Then we're back on Enter a value state with previous value of 5 preserved
      expect(tokenStateMachine.state.name).to.equal('Enter a value');
      expect(tokenStateMachine.state.vkey).to.equal('value');
      expect(tokenStateMachine.state.value.key).to.equal(5);
    });

    it('Returns to previous state even when current state is invalid', () => {
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

      // Given entry of: Age between foo (invalid)
      const tokenStateMachine = new TokenStateMachine(language.root);
      tokenStateMachine.rootState.options = [optAge, optHeight];
      tokenStateMachine.rootState.value = optAge;
      tokenStateMachine.transition();
      tokenStateMachine.state.options = [{key: 'between', shortKey: 'between'}, {key: 'equals', shortKey: '='}];
      tokenStateMachine.state.value = {key: 'between'};
      tokenStateMachine.transition();
      tokenStateMachine.state.value = {key: 'foo'};
      expect(tokenStateMachine.state.isValid).to.be.false;

      // When
      tokenStateMachine.rewind();

      // Then we're back on Choose a numeric value with previous value of `between` preserved
      expect(tokenStateMachine.state.name).to.equal('Choose a numeric relation');
      expect(tokenStateMachine.state.vkey).to.equal('relation');
      expect(tokenStateMachine.state.value.key).to.equal('between');
    });
  });
});