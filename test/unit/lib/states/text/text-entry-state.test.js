import { TextEntryState } from '../../../../../src/lib/states/text/text-entry-state';

describe('TextEntryState', () => {
  describe('isValid', () => {
    it('Returns true if value contains a `key` property with greater than zero length', () => {
      // Given
      const config = {};
      const textEntryState = new TextEntryState(config);
      // When
      textEntryState.value = {key: 'foo'};
      // Then
      expect(textEntryState.isValid).toBe(true);
    });

    it('Returns false if value does not contain a `key` property', () => {
      // Given
      const config = {};
      const textEntryState = new TextEntryState(config);
      // When
      textEntryState.value = {something: 'foo'};
      // Then
      expect(textEntryState.isValid).toBe(false);
    });

    it('Returns false if value `key` property is not a string', () => {
      // Given
      const config = {};
      const textEntryState = new TextEntryState(config);
      // When
      textEntryState.value = {key: 42};
      // Then
      expect(textEntryState.isValid).toBe(false);
    });

    it('Returns false if value `key` property is an empty string', () => {
      // Given
      const config = {};
      const textEntryState = new TextEntryState(config);
      // When
      textEntryState.value = {key: ''};
      // Then
      expect(textEntryState.isValid).toBe(false);
    });

    it('Returns false if value `key` property is null', () => {
      // Given
      const config = {};
      const textEntryState = new TextEntryState(config);
      // When
      textEntryState.value = {key: null};
      // Then
      expect(textEntryState.isValid).toBe(false);
    });
  });
});
