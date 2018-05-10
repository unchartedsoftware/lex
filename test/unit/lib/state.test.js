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
      expect(result).toEqual('John');
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
      expect(result).toEqual('John');
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
      expect(result).toEqual(boxed);
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
      expect(result).toEqual(unboxed);
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
      expect(state.isValid).toBe(true);
    });

    it('Uses validate function provided via config', () => {
      // Given
      const config = {
        defaultValue: 'foo',
        validate: (value, archive) => false // eslint-disable-line no-unused-vars
      };
      const validateSpy = jest.spyOn(config, 'validate');
      const state = new State(config);
      // Then
      expect(state.isValid).toBe(false);
      expect(validateSpy).toHaveBeenCalled();
      // Cleanup
      validateSpy.mockReset();
      validateSpy.mockRestore();
    });

    it('Throws error if provided validation function throws an error', () => {
      // Given
      const config = {
        defaultValue: 'foo',
        validate: (value, archive) => { // eslint-disable-line no-unused-vars
          throw new Error('test validation error');
        }
      };
      const state = new State(config);
      // Then
      expect(() => state.isValid).toThrow(Error);
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
      expect(archive).toHaveLength(1);
      expect(archive[0]).toEqual(someVal);
      expect(state.value).toBe(null);
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
      expect(archive).toHaveLength(2);
      expect(archive[0]).toEqual(someVal1);
      expect(archive[1]).toEqual(someVal2);
      expect(state.value).toBe(null);
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
      expect(state.archiveValue).toThrow(Error);
    });
  });

  describe('archiveValue -> unarchiveValue interaction', () => {
    it('unarchive returns elements in LIFO order', () => {
      // Given a state with 3 archived values
      const config = {};
      const state = new State(config);
      state.value = 'first';
      state.archiveValue();
      state.value = 'second';
      state.archiveValue();
      state.value = 'third';
      state.archiveValue();
      // When
      state.unarchiveValue();
      // Then expect last item in comes out first
      expect(state.value).toEqual('third');
      // etc for remaining items
      state.unarchiveValue();
      expect(state.value).toEqual('second');
      state.unarchiveValue();
      expect(state.value).toEqual('first');
    });
  });
});
