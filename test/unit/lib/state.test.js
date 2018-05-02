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
});
