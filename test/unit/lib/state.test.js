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
      // Then
      expect(state.isValid).to.be.true;
    });

    it('Uses validate function provided via config', () => {
      // Given
      const config = {
        defaultValue: 'foo',
        validate: (value, archive) => false // eslint-disable-line no-unused-vars
      };
      const state = new State(config);
      // Then
      expect(state.isValid).to.be.false;
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
      // Then
      expect(() => state.isValid).to.throw(TypeError);
    });
  });

  describe('archiveValue', () => {
    it('Moves current value to archive and resets current value', () => {
      // Given
      const config = {};
      const state = new State(config);
      const someVal = 'bar';
      state.value = someVal;
      // When
      state.archiveValue();
      // Then
      const archive = state.archive;
      expect(archive.length).to.equal(1);
      expect(archive[0]).to.equal(someVal);
      expect(state.value).to.be.null;
    });

    it('Maintains multiple items in archive', () => {
      // Given
      const config = {};
      const state = new State(config);
      const someVal1 = 'foo';
      const someVal2 = 'bar';
      // When
      state.value = someVal1;
      state.archiveValue();
      state.value = someVal2;
      state.archiveValue();
      // Then
      const archive = state.archive;
      expect(archive.length).to.equal(2);
      expect(archive[0]).to.equal(someVal1);
      expect(archive[1]).to.equal(someVal2);
      expect(state.value).to.be.null;
    });

    it('Throws error if number of items in archive equals limit', () => {
      // Given a state with a limit of 2 and 2 archived items
      const config = {
        multivalueLimit: 2
      };
      const state = new State(config);
      const someVal1 = 'foo';
      const someVal2 = 'bar';
      const someVal3 = 'bat';
      state.value = someVal1;
      state.archiveValue();
      state.value = someVal2;
      state.archiveValue();
      state.value = someVal3;
      // Then attempting to archive one more exceeds limit
      expect(state.archiveValue).to.throw(Error);
    });
  });
});
