import { State } from '../../state';
import moment from 'moment';
import 'moment-timezone';

const _dateFormat = new WeakMap();
const _timeZone = new WeakMap();

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
        return val !== null; // all good as long as the boxed value isn't null. If it was invalid, moment would have returned null.
      };
    }
    if (moment.tz.zone(config.timezone) === null) throw new Error(`Timezone ${config.timezone} does not exist.`);
    super(config);
    _dateFormat.set(this, config.format);
    _timeZone.set(this, config.timezone);
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
