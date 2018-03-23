import {OptionState} from '../generic/option-state';

/**
 * This state supports the entry of a Number value, with possible auto-complete
 *
 * @param {Object} config - A configuration object. Supports all of the parameters from `OptionState` and `StateTemplate`,
 *                          providing defaults for `name`, `validate` (valid iff `!isNaN`) and `allowUnknown` (true).
 */
export class CurrencyEntryState extends OptionState {
  constructor (config) {
    if (config.name === undefined) config.name = 'Enter a value';
    if (config.validate === undefined) {
      config.validate = (val) => {
        return !isNaN(val.key);
      };
    }
    config.allowUnknown = true;
    super(config);
  }

  unformatUnboxedValue (displayKey) {
    if (displayKey === undefined && displayKey === null) return null;
    return displayKey.replace(/\$|,/g, '');
  }

  formatUnboxedValue (key) {
    // don't format things that don't make sense
    if (key === undefined || key === null) return null;
    if (key.length === 0) return '';
    if (isNaN(key)) return key;
    const decimalSplit = key.split('.');
    const dollarPart = decimalSplit[0];
    const centsPart = decimalSplit.length > 1 ? `.${decimalSplit[1]}` : '';
    // otherwise format with commas and dollar sign
    const chars = dollarPart.split('').reverse();
    let commaKey = [];
    while (chars.length > 0) {
      commaKey.push(chars.splice(0, 3).reverse().join(''));
    }
    commaKey = commaKey.reverse().join(',');
    return `$${commaKey}${centsPart}`;
  }
}
