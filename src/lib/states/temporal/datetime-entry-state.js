import { State } from '../../state';
import moment from 'moment';
import 'moment-timezone';

const _dateFormat = new WeakMap();
const _timeZone = new WeakMap();
const _minDate = new WeakMap();
const _maxDate = new WeakMap();
const _hilightedDate = new WeakMap();

/**
 * This state supports the entry of a Date/Time value, with support for a custom acceptable format
 *
 * @param {Object} config - A configuration object. Supports all of the parameters from `State`,
 *                          providing defaults for `name` and `validate`.
 * @param {string|undefined} config.format - The acceptable format for a typed date. Defaults to `'YYYY/MM/DD'`.
 * @param {string|undefined} config.timezone - The assumed timezone for a typed date. Defaults to `'Etc/UTC'`.
 */
export class DateTimeEntryState extends State {
  constructor (config) {
    if (config.name === undefined) config.name = 'Enter a date';
    if (config.format === undefined) config.format = 'YYYY/MM/DD';
    if (config.timezone === undefined) config.timezone = 'Etc/UTC';
    if (config.validate === undefined) {
      config.validate = (val) => {
        // all good as long as the boxed value isn't null. If it was invalid, moment would have returned null.
        let isValid = val !== null;
        if (isValid) {
          const stringDate = moment.tz(val, this.timezone).format(this.format); // get incoming date as a string
          const dateVal = moment(stringDate, this.format).toDate();

          if (this.minDate && this.minDate instanceof Date) {
            const stringDate = moment.tz(this.minDate, this.timezone).format(this.format); // get incoming date as a string
            isValid = isValid && moment(dateVal).isSameOrAfter(moment(stringDate, this.format));
          }

          if (this.maxDate && this.maxDate instanceof Date) {
            const stringDate = moment.tz(this.maxDate, this.timezone).format(this.format); // get incoming date as a string
            isValid = isValid && moment(dateVal).isSameOrBefore(moment(stringDate, this.format));
          }
        }

        return isValid;
      };
    }
    if (moment.tz.zone(config.timezone) === null) throw new Error(`Timezone ${config.timezone} does not exist.`);
    super(config);
    _dateFormat.set(this, config.format);
    _timeZone.set(this, config.timezone);
    _minDate.set(this, config.minDate);
    _maxDate.set(this, config.maxDate);
    _hilightedDate.set(this, config.hilightedDate);
  }

  /**
   * Getter for `format`.
   *
   * @returns {string} - The acceptable date format for this state.
   */
  get format () {
    return _dateFormat.get(this);
  }

  /**
   * Getter for `timezone`.
   *
   * @returns {string} - The timezone that all entered dates will be interpreted in.
   */
  get timezone () {
    return _timeZone.get(this);
  }

  /**
   * Getter for `minDate`.
   *
   * @returns {Date} - The mininum date the picker will allow to be selected.
   */
  get minDate () {
    return _minDate.get(this);
  }

  /**
   * Getter for `maxDate`.
   *
   * @returns {Date} - The maximum date the picker will allow to be selected.
   */
  get maxDate () {
    return _maxDate.get(this);
  }

  /**
   * Getter for `hilightedDate`.
   *
   * @returns {Date} - The date that the picker will initialize with as hilighted.
   */
  get hilightedDate () {
    return _hilightedDate.get(this);
  }

  /**
   * Transform a user-supplied value into an internal representation.
   *
   * @param {string} datestring - The user-supplied value.
   * @returns {Date} A `Date` instance, or `null` if the `datestring` does not respect `this.format`.
   */
  boxValue (datestring) {
    const result = moment.tz(datestring, this.format, true, this.timezone);
    return isNaN(result.valueOf()) ? null : result.toDate();
  }

  /**
   * Transforms an internal representation of a value into a user-supplied-style value.
   *
   * @param {Date} dateobj - A `Date` instance.
   * @returns {string} - The string value of the `Date`, formatted appropriately.
   */
  unboxValue (dateobj) {
    if (dateobj === null || dateobj === undefined) return null;
    const m = moment.tz(dateobj, this.timezone);
    return m.isValid() ? m.format(this.format) : null;
  }
}
