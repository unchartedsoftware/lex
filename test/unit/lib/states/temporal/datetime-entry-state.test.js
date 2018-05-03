// test dependencies
import { expect } from 'chai';
// system under test
import { DateTimeEntryState } from '../../../../../src/lib/states/temporal/datetime-entry-state';

describe('DateTimeEntryState', () => {
  describe('unbox', () => {
    it('Returns null when given a null date object', () => {
      // Given
      const config = {};
      const dateTimeEntryState = new DateTimeEntryState(config);
      const dateobj = null;
      // When
      const result = dateTimeEntryState.unboxValue(dateobj);
      // Then
      expect(result).to.be.null;
    });

    it('Returns null when not given a date object', () => {
      // Given
      const config = {};
      const dateTimeEntryState = new DateTimeEntryState(config);
      // When
      const result = dateTimeEntryState.unboxValue();
      // Then
      expect(result).to.be.null;
    });

    it('Returns a default formatted date for the default timezone', () => {
      // Given
      const config = {};
      const dateTimeEntryState = new DateTimeEntryState(config);
      const dateobj = new Date('2018-12-17T05:39:00');
      // When
      const result = dateTimeEntryState.unboxValue(dateobj);
      // Then
      expect(result).to.equal('2018/12/17');
    });

    it('Returns a custom formatted date for the default timezone', () => {
      // Given
      const config = {
        format: 'YYYY-MMM-DD'
      };
      const dateTimeEntryState = new DateTimeEntryState(config);
      const dateobj = new Date('2018-12-17');
      // When
      const result = dateTimeEntryState.unboxValue(dateobj);
      // Then
      expect(result).to.equal('2018-Dec-17');
    });

    it('Returns a custom formatted date for a custom timezone', () => {
      // Given
      const config = {
        format: 'YYYY-MMM-DD',
        timezone: 'Etc/GMT-14'
      };
      const dateTimeEntryState = new DateTimeEntryState(config);
      const dateobj = new Date('2018-12-17');
      // When
      const result = dateTimeEntryState.unboxValue(dateobj);
      // Then
      expect(result).to.equal('2018-Dec-17');
    });
  });
});
