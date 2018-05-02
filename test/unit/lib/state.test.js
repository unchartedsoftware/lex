// test dependencies
import { expect } from 'chai';
// system under test
import { State } from '../../../src/lib/state';

describe('State', () => {
  describe('unboxValue', () => {
    it('Returns same internal representation as provided', () => {
      // Given
      const config = {};
      const state = new State(config);
      const internalRepresentation = 'John';
      // When
      const result = state.unboxValue(internalRepresentation);
      // Then
      expect(result).to.equal('John');
    });
  });

  describe('boxValue', () => {
    it('Returns same value as provided', () => {
      // Given
      const config = {};
      const state = new State(config);
      const userVal = 'John';
      // When
      const result = state.boxValue(userVal);
      // Then
      expect(result).to.equal('John');
    });
  });

  describe('box unbox interactions', () => {
    it('box -> unbox -> box returns first boxed result', () => {
      // Given
      const config = {};
      const state = new State(config);
      const userVal = 'John';
      // When
      const boxed = state.boxValue(userVal);
      const unboxed = state.unboxValue(boxed);
      const result = state.boxValue(unboxed);
      // Then
      expect(result).to.equal(boxed);
    });

    it('unbox -> box -> unbox returns first unboxed result', () => {
      // Given
      const config = {};
      const state = new State(config);
      const internalRepresentation = 'John';
      // When
      const unboxed = state.unboxValue(internalRepresentation);
      const boxed = state.boxValue(unboxed);
      const result = state.unboxValue(boxed);
      // Then
      expect(result).to.equal(unboxed);
    });
  });

  describe('isValid', () => {
    it('Uses default validate function to always return true', () => {
      // Given
      const config = {
        defaultValue: 'foo'
      };
      const state = new State(config);
      // When
      const result = state.isValid;
      // Then
      expect(result).to.be.true;
    });

    it('Uses validate function provided via config', () => {
      // Given
      const config = {
        defaultValue: 'foo',
        validate: (value, archive) => false // eslint-disable-line no-unused-vars
      };
      const state = new State(config);
      // When
      const result = state.isValid;
      // Then
      expect(result).to.be.false;
    });

    it('Throws error if provided validation function throws an error', () => {
      // Given
      const config = {
        defaultValue: 'foo',
        validate: (value, archive) => { // eslint-disable-line no-unused-vars
          throw new TypeError('test validation error');
        }
      };
      const state = new State(config);
      // When
      const valFn = () => state.isValid;
      // Then
      expect(valFn).to.throw(TypeError);
    });
  });
});
