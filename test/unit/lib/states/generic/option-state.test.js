// test dependencies
import { expect } from 'chai';
// system under test
import { OptionState, OptionStateOption } from '../../../../../src/lib/states/generic/option-state';

describe('OptionState', () => {
  describe('unboxValue', () => {
    it('Returns option key', () => {
      // Given
      const config = {};
      const optionState = new OptionState(config);
      const option = new OptionStateOption('First Name');
      // When
      const result = optionState.unboxValue(option);
      // Then
      expect(result).to.equal('First Name');
    });

    it('Returns null when option is undefined', () => {
      // Given
      const config = {};
      const optionState = new OptionState(config);
      // When
      const result = optionState.unboxValue();
      // Then
      expect(result).to.be.null;
    });

    it('Returns null when option is null', () => {
      // Given
      const config = {};
      const optionState = new OptionState(config);
      const option = null;
      // When
      const result = optionState.unboxValue(option);
      // Then
      expect(result).to.be.null;
    });
  });

  describe('boxValue', () => {
    it('Returns matching OptionStateOption', () => {
      // Given
      const config = {};
      const optionState = new OptionState(config);
      optionState.options = [
        new OptionStateOption('First Name'),
        new OptionStateOption('Last Name')
      ];
      const key = 'Last Name';
      // When
      const result = optionState.boxValue(key);
      // Then
      expect(result).to.be.an.instanceof(OptionStateOption);
      expect(result.key).to.equal(key);
    });

    it('Returns an empty OptionStateOption when no options match and allowUnknown is true', () => {
      // Given
      const config = {
        allowUnknown: true
      };
      const optionState = new OptionState(config);
      optionState.options = [
        new OptionStateOption('First Name'),
        new OptionStateOption('Last Name')
      ];
      const key = 'Age';
      // When
      const result = optionState.boxValue(key);
      // Then
      expect(result).to.be.an.instanceof(OptionStateOption);
      expect(result.key).to.equal('Age');
    });

    it('Throws error when no options match and allowUnknown is false', () => {
      // Given
      const config = {};
      const optionState = new OptionState(config);
      const key = 'Age';
      // Then
      expect(optionState.boxValue.bind(optionState, key)).to.throw();
    });

    // Doesn't throw because `this.options.length` !== 0 but should it?
    // it('TBD...', () => {
    //   // Given
    //   const config = {};
    //   const optionState = new OptionState(config);
    //   optionState.options = [
    //     new OptionStateOption('First Name'),
    //     new OptionStateOption('Last Name')
    //   ];
    //   const key = 'Age';
    //   // Then
    //   expect(optionState.boxValue.bind(optionState, key)).to.throw();
    // });
  });

  describe('box unbox interactions', () => {
    it('box -> unbox -> box returns first boxed result', () => {
      // Given
      const config = {};
      const optionState = new OptionState(config);
      optionState.options = [
        new OptionStateOption('First Name'),
        new OptionStateOption('Last Name')
      ];
      const key = 'Last Name';
      // When
      const boxed = optionState.boxValue(key);
      const unboxed = optionState.unboxValue(boxed);
      const result = optionState.boxValue(unboxed);
      // Then
      expect(result).to.deep.equal(boxed);
    });

    it('unbox -> box -> unbox returns first unboxed result', () => {
      // Given
      const config = {};
      const optionState = new OptionState(config);
      optionState.options = [
        new OptionStateOption('First Name'),
        new OptionStateOption('Last Name')
      ];
      const option = {
        key: 'First Name'
      };
      // When
      const unboxed = optionState.unboxValue(option);
      const boxed = optionState.boxValue(unboxed);
      const result = optionState.unboxValue(boxed);
      // Then
      expect(result).to.deep.equal(unboxed);
    });
  });

  describe('isValid', () => {
    it('Returns false when validation function provided via config returns false', () => {
      // Given
      const config = {
        validate: (value, archive) => false // eslint-disable-line no-unused-vars
      };
      const optionState = new OptionState(config);
      // Then
      expect(optionState.isValid).to.be.false;
    });

    it('Using default validation, returns false when value is null', () => {
      // Given
      const config = {};
      const optionState = new OptionState(config);
      optionState.value = null;
      // Then
      expect(optionState.isValid).to.be.false;
    });

    it('Using default validation, returns false when value is undefined', () => {
      // Given
      const config = {};
      const optionState = new OptionState(config);
      optionState.value = undefined;
      // Then
      expect(optionState.isValid).to.be.false;
    });

    it('Using default validation, returns false when value already exists in archive', () => {
      // Given a state with one value in archive
      const config = {};
      const optionState = new OptionState(config);
      optionState.options = [
        new OptionStateOption('First Name'),
        new OptionStateOption('Last Name')
      ];
      optionState.value = new OptionStateOption('First Name');
      optionState.archiveValue();
      // When a value is set that is already in the archive
      optionState.value = new OptionStateOption('First Name');
      // Then it should be considered invalid
      expect(optionState.isValid).to.be.false;
    });

    it('Using default validation, returns true when allowUknown is true and value is defined and not already in archive', () => {
      // Given
      const config = {
        allowUnknown: true
      };
      const optionState = new OptionState(config);
      optionState.value = new OptionStateOption('Age');
      // Then
      expect(optionState.isValid).to.be.true;
    });

    it('Using default validation, returns true when value matches an option by key', () => {
      // Given
      const config = {};
      const optionState = new OptionState(config);
      optionState.options = [
        new OptionStateOption('First Name'),
        new OptionStateOption('Last Name')
      ];
      optionState.value = new OptionStateOption('First Name');
      // Then
      expect(optionState.isValid).to.be.true;
    });

    it('Using default validation, returns false when value does not match an option by key and allowUknown is false', () => {
      // Given
      const config = {};
      const optionState = new OptionState(config);
      optionState.options = [
        new OptionStateOption('First Name'),
        new OptionStateOption('Last Name')
      ];
      optionState.value = new OptionStateOption('Age');
      // Then
      expect(optionState.isValid).to.be.false;
    });
  });
});
