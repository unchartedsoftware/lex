// test dependencies
import { expect } from 'chai';
// system under test
import { DateTimeEntryState } from '../../../../../src/lib/states/temporal/datetime-entry-state';

describe('DateTimeEntryState', () => {
  describe('unboxValue', () => {
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

    // Should we expect a different result than default timezone?
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

  describe('boxValue', () => {
    it('Returns a date object given a date string matching the default format, in the default timezone', () => {
      // Given
      const config = {};
      const dateTimeEntryState = new DateTimeEntryState(config);
      const datestring = '2018/12/17';
      // When
      const result = dateTimeEntryState.boxValue(datestring);
      // Then
      expect(typeof result).to.equal('object');
      expect(result.getUTCFullYear()).to.equal(2018);
      expect(result.getUTCMonth()).to.equal(11); // js months Jan to Dec -> 0 to 11
      expect(result.getUTCDate()).to.equal(17);
    });

    it('Returns null when date string does not match default format', () => {
      // Given
      const config = {};
      const dateTimeEntryState = new DateTimeEntryState(config);
      const datestring = '2018-12-17';
      // When
      const result = dateTimeEntryState.boxValue(datestring);
      // Then
      expect(result).to.be.null;
    });
  });

  describe('box unbox interactions', () => {
    it('box -> unbox -> box returns first boxed result', () => {
      // Given
      const config = {};
      const dateTimeEntryState = new DateTimeEntryState(config);
      const datestring = '2018/12/17';
      // When
      const boxed = dateTimeEntryState.boxValue(datestring);
      const unboxed = dateTimeEntryState.unboxValue(boxed);
      const result = dateTimeEntryState.boxValue(unboxed);
      // Then
      expect(result).to.deep.equal(boxed);
    });

    it('unbox -> box -> unbox returns first unboxed result', () => {
      // Given
      const config = {};
      const dateTimeEntryState = new DateTimeEntryState(config);
      const dateobj = new Date('2018-12-17');
      // When
      const unboxed = dateTimeEntryState.unboxValue(dateobj);
      const boxed = dateTimeEntryState.boxValue(unboxed);
      const result = dateTimeEntryState.unboxValue(boxed);
      // Then
      expect(result).to.equal(unboxed);
    });
  });
});
