import { StateTemplate } from '../../state';
const moment = require('moment'); // couldn't get es6 import working here

const _dateFormat = new WeakMap();

/**
 * This state supports the entry of a Date/Time value, with support for a custom acceptable format
 *
 * @param {Object} config - A configuration object. Supports all of the parameters from `StateTemplate`,
 *                          providing defaults for `name` and `validate`.
 * @param {string|undefined} config.format - The acceptable format for a typed date. Defaults to `'YYYY/MM/DD'`.
 */
export class DateTimeEntryState extends StateTemplate {
  constructor (config) {
    if (config.name === undefined) config.name = 'Enter a date';
    if (config.format === undefined) config.format = 'YYYY/MM/DD';
    if (config.validate === undefined) {
      config.validate = (val) => {
        return val !== null; // all good as long as the boxed value isn't null. If it was invalid, moment would have returned null.
      };
    }
    super(config);
    _dateFormat.set(this, config.format);
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
   * Transform a user-supplied value into an internal representation.
   *
   * @param {string} datestring - The user-supplied value.
   * @returns {Date} A `Date` instance, or `null` if the `datestring` does not respect `this.format`.
   */
  boxValue (datestring) {
    const result = moment(datestring, this.format, true);
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
    const m = moment(dateobj);
    return m.isValid() ? m.format(this.format) : null;
  }
}
