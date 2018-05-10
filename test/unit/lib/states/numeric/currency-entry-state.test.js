import { CurrencyEntryState } from '../../../../../src/lib/states/numeric/currency-entry-state';

describe('CurrencyEntryState', () => {
  describe('unformatUnboxedValue', () => {
    it('Removes `$` characters', () => {
      // Given
      const currencyEntryState = new CurrencyEntryState({});
      const displayKey = '$123.45';
      // When
      const result = currencyEntryState.unformatUnboxedValue(displayKey);
      // Then
      expect(result).toEqual('123.45');
    });

    it('Removes `,` characters', () => {
      // Given
      const currencyEntryState = new CurrencyEntryState({});
      const displayKey = '123,456';
      // When
      const result = currencyEntryState.unformatUnboxedValue(displayKey);
      // Then
      expect(result).toEqual('123456');
    });
  });

  describe('formatUnboxedValue', () => {
    it('Formats decimal numerical as currency', () => {
      // Given
      const currencyEntryState = new CurrencyEntryState({});
      const key = '123.45';
      // When
      const result = currencyEntryState.formatUnboxedValue(key);
      // Then
      expect(result).toEqual('$123.45');
    });

    it('Formats number with thousands separator', () => {
      // Given
      const currencyEntryState = new CurrencyEntryState({});
      const key = '123456';
      // When
      const result = currencyEntryState.formatUnboxedValue(key);
      // Then
      expect(result).toEqual('$123,456');
    });

    it('Returns original key when not a number', () => {
      // Given
      const currencyEntryState = new CurrencyEntryState({});
      const key = 'abc';
      // When
      const result = currencyEntryState.formatUnboxedValue(key);
      // Then
      expect(result).toEqual('abc');
    });
  });
});
