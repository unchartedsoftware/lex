import {Option, OptionSelection} from '../generic/option-selection';

const options = ['less than', 'greater than', 'equals', 'between'].map(o => new Option(o));

/**
 * This state supports the selection of a numeric relation from a list of options.
 */
export class NumericRelationSelection extends OptionSelection {
  /**
   * @param {State|undefined} parent - The parent state. Undefined if this is a root.
   */
  constructor (parent) {
    super(parent, 'Choose a numeric relation', options);
  }
}
