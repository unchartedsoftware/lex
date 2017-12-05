import {Option, OptionSelection} from '../generic/option-selection';

const options = ['is', 'is like', 'contains'].map(o => new Option(o));

/**
 * This state supports the selection of a text relation from a list of options.
 */
export class TextRelationSelection extends OptionSelection {
  /**
   * @param {State|undefined} parent - The parent state. Undefined if this is a root.
   */
  constructor (parent) {
    super(parent, 'text relation selection', options);
  }
}
