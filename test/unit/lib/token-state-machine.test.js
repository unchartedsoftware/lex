import { TokenStateMachine } from '../../../src/lib/token-state-machine';
import {
  LabelState,
  Lex,
  NumericEntryState,
  NumericRelationState,
  OptionState,
  OptionStateOption,
  StateTransitionError,
  TerminalState,
  TextEntryState,
  TransitionFactory
} from '../../../src/lex';

describe('TokenStateMachine', () => {
  describe('transition', () => {
    it('Walks a simple tree', async () => {
      // Given a simple language
      const optFirstName = new OptionStateOption('First Name');
      const optLastName = new OptionStateOption('Last Name');
      const language = Lex.from('field', OptionState, {
        name: 'Choose a field to search',
        options: [optFirstName, optLastName]
      })
        .to('value', TextEntryState);

      // When machine is initialized with language root
      const tokenStateMachine = new TokenStateMachine(language.root);
      tokenStateMachine.reset();
      await wait();
      spyOn(tokenStateMachine, 'emit');

      // Then verify expected root state
      expect(tokenStateMachine.id).toBeDefined();
      expect(tokenStateMachine.rootState.name).toEqual('Choose a field to search');
      expect(tokenStateMachine.rootState.vkey).toEqual('field');

      // Select First Name option
      tokenStateMachine.rootState.value = optFirstName;

      // When transition is invoked
      tokenStateMachine.transition();

      // Then verify state change events
      expect(tokenStateMachine.emit.calls.argsFor(0)[0]).toEqual('before state change');
      expect(tokenStateMachine.emit.calls.argsFor(1)[0]).toEqual('state changed');

      // Then verify current state
      expect(tokenStateMachine.state.name).toEqual('Enter a value');
      expect(tokenStateMachine.state.vkey).toEqual('value');

      // Given a value is entered
      tokenStateMachine.state.value = {key: 'Joe'};

      // When another transition is invoked
      tokenStateMachine.transition();

      // Then expect to be in terminal state
      expect(tokenStateMachine.state.isTerminal).toBe(true);
      expect(tokenStateMachine.value.field.key).toEqual('First Name');
      expect(tokenStateMachine.value.value.key).toEqual('Joe');

      // Verify last event emitted is for terminal state
      expect(tokenStateMachine.emit.calls.mostRecent().args[0]).toEqual('end');
    });

    it('Walks a tree with branches', async () => {
      // Given a language with branches
      const optAge = new OptionStateOption('Age');
      const optHeight = new OptionStateOption('Height');
      const language = Lex.from('field', OptionState, {
        name: 'Choose a field to search',
        options: [optAge, optHeight]
      })
        .branch(
          Lex.from('relation', NumericRelationState)
            .branch(
              Lex.from('value', NumericEntryState, TransitionFactory.optionKeyIsNot('between')),
              Lex.from('value', NumericEntryState, TransitionFactory.optionKeyIs('between')).to(LabelState, {label: 'and'}).to('secondaryValue', NumericEntryState)
            )
        );

      // When machine is initialized with language root
      const tokenStateMachine = new TokenStateMachine(language.root);
      tokenStateMachine.reset();
      await wait();

      // Then verify expected root state
      expect(tokenStateMachine.id).toBeDefined();
      expect(tokenStateMachine.rootState.name).toEqual('Choose a field to search');
      expect(tokenStateMachine.rootState.vkey).toEqual('field');

      // Given height option has been selected
      tokenStateMachine.rootState.value = optHeight;

      // When transition is invoked
      tokenStateMachine.transition();
      await wait();

      // Then verify current state
      expect(tokenStateMachine.state.name).toEqual('Choose a numeric relation');
      expect(tokenStateMachine.state.vkey).toEqual('relation');

      // Given a relation has been chosen
      tokenStateMachine.state.value = {key: 'between'};

      // When another transition is invoked
      tokenStateMachine.transition();

      // Then verify current state
      expect(tokenStateMachine.state.name).toEqual('Enter a value');
      expect(tokenStateMachine.state.vkey).toEqual('value');

      // Given a value is entered
      tokenStateMachine.state.value = {key: 60};

      // When another transition is invoked
      tokenStateMachine.transition();

      // Then verify current state
      expect(tokenStateMachine.state.name).toEqual('Enter a value');
      expect(tokenStateMachine.state.vkey).toEqual('secondaryValue');

      // Given a secondary value is entered
      tokenStateMachine.state.value = {key: 65};

      // When another transition is invoked
      tokenStateMachine.transition();

      // Then expect to be in terminal state
      expect(tokenStateMachine.state.isTerminal).toBe(true);
      expect(tokenStateMachine.value.field.key).toEqual('Height');
      expect(tokenStateMachine.value.relation.key).toEqual('between');
      expect(tokenStateMachine.value.value.key).toEqual(60);
      expect(tokenStateMachine.value.secondaryValue.key).toEqual(65);
    });

    it('Skips over readonly state', async () => {
      // Given a language with a LabelState (which is readonly)
      const optHeight = new OptionStateOption('Height');
      const language = Lex.from('field', OptionState, {
        name: 'Choose a field to search',
        options: [optHeight]
      })
        .to('heightFeet', NumericEntryState, {units: "'"})
        .to(LabelState, {label: 'and'})
        .to('heightInches', NumericEntryState, {units: "'"});

      // When machine is initialized with language root
      const tokenStateMachine = new TokenStateMachine(language.root);
      tokenStateMachine.reset();
      await wait();

      // Then verify expected root state
      expect(tokenStateMachine.id).toBeDefined();
      expect(tokenStateMachine.rootState.name).toEqual('Choose a field to search');
      expect(tokenStateMachine.rootState.vkey).toEqual('field');

      // Given Height option is selected
      tokenStateMachine.rootState.value = optHeight;

      // When transition is invoked
      tokenStateMachine.transition();

      // Then verify current state
      expect(tokenStateMachine.state.name).toEqual('Enter a value');
      expect(tokenStateMachine.state.vkey).toEqual('heightFeet');

      // Given a value is entered
      tokenStateMachine.state.value = {key: 5};

      // When another transition is invoked
      tokenStateMachine.transition();

      // Then verify next state is also value entry (i.e. skipped over Label)
      expect(tokenStateMachine.state.name).toEqual('Enter a value');
      expect(tokenStateMachine.state.vkey).toEqual('heightInches');
    });

    it('Transitions to terminal state for terminal option', async () => {
      // Given a language with a terminal option
      const optName = new OptionStateOption('Name', {type: 'string'});
      const optTerminal = new OptionStateOption('Terminal', {type: 'terminal'});
      const language = Lex.from('field', OptionState, {
        name: 'Choose a field to search',
        options: [optName, optTerminal]
      })
        .branch(
          Lex.from('value', TextEntryState, TransitionFactory.optionMetaCompare({type: 'string'})),
          Lex.from('terminal', TerminalState, TransitionFactory.optionMetaCompare({type: 'terminal'}))
        );

      // When machine is initialized with language root
      const tokenStateMachine = new TokenStateMachine(language.root);
      tokenStateMachine.reset();
      await wait();

      // Then verify expected root state
      expect(tokenStateMachine.id).toBeDefined();
      expect(tokenStateMachine.rootState.name).toEqual('Choose a field to search');
      expect(tokenStateMachine.rootState.vkey).toEqual('field');

      // Given that Terminal option is selected
      tokenStateMachine.rootState.value = optTerminal;

      // When transition is invoked
      tokenStateMachine.transition();

      // Then expect to be in terminal state
      expect(tokenStateMachine.state.isTerminal).toBe(true);
      expect(tokenStateMachine.value.field.key).toEqual('Terminal');
      expect(tokenStateMachine.value.value).toBeUndefined();
    });

    it('Does not transition when in an invalid state', async () => {
      // Given a language with a numeric option
      const optAge = new OptionStateOption('Age');
      const language = Lex.from('field', OptionState, {
        name: 'Choose a field to search',
        options: [optAge]
      })
        .to('value', NumericEntryState);

      // When machine is initialized with language root
      const tokenStateMachine = new TokenStateMachine(language.root);
      spyOn(tokenStateMachine, 'emit');
      tokenStateMachine.reset();
      await wait();

      // Then verify expected root state
      expect(tokenStateMachine.id).toBeDefined();
      expect(tokenStateMachine.rootState.name).toEqual('Choose a field to search');
      expect(tokenStateMachine.rootState.vkey).toEqual('field');

      // Given First Name option is selected
      tokenStateMachine.rootState.value = optAge;

      // When transition is invoked
      tokenStateMachine.transition();

      // Then verify current state
      expect(tokenStateMachine.state.name).toEqual('Enter a value');
      expect(tokenStateMachine.state.vkey).toEqual('value');

      // Given an invalid value is entered
      tokenStateMachine.state.value = {key: 'not a number'};

      // Then will fail to transition
      expect(tokenStateMachine.transition.bind(tokenStateMachine)).toThrow(StateTransitionError);
      expect(tokenStateMachine.emit.calls.mostRecent().args[0]).toEqual('state change failed');
    });

    it('Fails if parent state is valid but there is no child state to transition to', async () => {
      // Given a contrived language where the only child does not allow transitioning into
      const optFirstName = new OptionStateOption('First Name');
      const language = Lex.from('field', OptionState, {
        name: 'Choose a field to search',
        options: [optFirstName]
      })
        .to('value', TextEntryState, {
          transition: () => false
        });

      // When machine is initialized with language root
      const tokenStateMachine = new TokenStateMachine(language.root);
      tokenStateMachine.reset();
      await wait();

      // Then verify expected root state
      expect(tokenStateMachine.id).toBeDefined();
      expect(tokenStateMachine.rootState.name).toEqual('Choose a field to search');
      expect(tokenStateMachine.rootState.vkey).toEqual('field');

      // Given First Name option is selected
      tokenStateMachine.rootState.value = optFirstName;

      // Then expect state transition error on attempting to transition
      expect(tokenStateMachine.transition.bind(tokenStateMachine)).toThrow(StateTransitionError);
    });
  });

  describe('rewind', () => {
    it('Returns to previous state', async () => {
      // Given a language with branches
      const optAge = new OptionStateOption('Age');
      const optHeight = new OptionStateOption('Height');
      const language = Lex.from('field', OptionState, {
        name: 'Choose a field to search',
        options: [optAge, optHeight]
      })
        .branch(
          Lex.from('relation', NumericRelationState)
            .branch(
              Lex.from('value', NumericEntryState, TransitionFactory.optionKeyIsNot('between')),
              Lex.from('value', NumericEntryState, TransitionFactory.optionKeyIs('between')).to(LabelState, {label: 'and'}).to('secondaryValue', NumericEntryState)
            )
        );

      // Given entry of: Age between 5 and
      const tokenStateMachine = new TokenStateMachine(language.root);
      tokenStateMachine.reset();
      await wait();
      spyOn(tokenStateMachine, 'emit');
      tokenStateMachine.rootState.value = optAge;
      tokenStateMachine.transition();
      await wait();
      tokenStateMachine.state.value = {key: 'between'};
      tokenStateMachine.transition();
      tokenStateMachine.state.value = {key: 5};
      tokenStateMachine.transition();

      // When
      tokenStateMachine.rewind();
      expect(tokenStateMachine.emit.calls.mostRecent().args[0]).toEqual('state changed');

      // Then we're back on Enter a value state with previous value of 5 preserved
      expect(tokenStateMachine.state.name).toEqual('Enter a value');
      expect(tokenStateMachine.state.vkey).toEqual('value');
      expect(tokenStateMachine.state.value.key).toEqual(5);
    });

    it('Returns to previous state even when current state is invalid', async () => {
      // Given a language with branches
      const optAge = new OptionStateOption('Age');
      const optHeight = new OptionStateOption('Height');
      const language = Lex.from('field', OptionState, {
        name: 'Choose a field to search',
        options: [optAge, optHeight]
      })
        .branch(
          Lex.from('relation', NumericRelationState)
            .branch(
              Lex.from('value', NumericEntryState, TransitionFactory.optionKeyIsNot('between')),
              Lex.from('value', NumericEntryState, TransitionFactory.optionKeyIs('between')).to(LabelState, {label: 'and'}).to('secondaryValue', NumericEntryState)
            )
        );

      // Given entry of: Age between foo (invalid)
      const tokenStateMachine = new TokenStateMachine(language.root);
      tokenStateMachine.reset();
      await wait();
      tokenStateMachine.rootState.value = optAge;
      tokenStateMachine.transition();
      await wait();
      tokenStateMachine.state.value = {key: 'between'};
      tokenStateMachine.transition();
      tokenStateMachine.state.value = {key: 'foo'};
      expect(tokenStateMachine.state.isValid).toBe(false);

      // When
      tokenStateMachine.rewind();

      // Then we're back on Choose a numeric value with previous value of `between` preserved
      expect(tokenStateMachine.state.name).toEqual('Choose a numeric relation');
      expect(tokenStateMachine.state.vkey).toEqual('relation');
      expect(tokenStateMachine.state.value.key).toEqual('between');
    });
  });
});
