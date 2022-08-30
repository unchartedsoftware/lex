import { h } from 'preact';
import { Builder } from '../../builder';

/**
 * A visual representation of a LabelState.
 *
 * @example
 * lex.registerBuilder(LabelState, LabelBuilder)
 */
export class LabelBuilder extends Builder {
  renderInteractive (props, state) {
    return this.renderReadOnly(props, state);
  }
}
