import { h } from 'preact';
import { Builder } from '../../builder';

/**
 * A visual representation of a TerminalState
 *
 * @example
 * lex.registerBuilder(TerminalState, TerminalBuilder)
 */
export class TerminalBuilder extends Builder {
  renderReadOnly () {
    return null;
  }

  renderInteractive () {
    return null;
  }
}
