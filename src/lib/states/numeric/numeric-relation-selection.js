import {Option, OptionSelection} from '../generic/option-selection';

const options = ['less than', 'greater than', 'equals', 'between'].map(o => new Option(o));

/**
 * This state supports the selection of a numeric relation from a list of options.
 */
export class NumericRelationSelection extends OptionSelection {
  /**
   * @param {State|undefined} parent - The parent state. Undefined if this is a root.
   * @param {Function} transitionFunction - A function which returns true if this state is the next child to transition to, given the value of its parent. Undefined if this is root.
   */
  constructor (parent, transitionFunction) {
    super(parent, transitionFunction, 'Choose a numeric relation', options);
  }
}
