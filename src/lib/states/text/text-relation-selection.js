import {Option, OptionSelection} from '../generic/option-selection';

const options = ['is', 'is like', 'contains'].map(o => new Option(o));

/**
 * This state supports the selection of a text relation from a list of options.
 */
export class TextRelationSelection extends OptionSelection {
  /**
   * @param {State|undefined} parent - The parent state. Undefined if this is a root.
   * @param {Function} transitionFunction - A function which returns true if this state is the next child to transition to, given the value of its parent. Undefined if this is root.
   */
  constructor (parent, transitionFunction) {
    super(parent, transitionFunction, 'Choose a text relation', options);
  }
}
