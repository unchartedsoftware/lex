import { h, Component } from 'preact';
import { Bind } from 'lodash-decorators';
import { propsToState } from '../lib/util';

/**
 * Interactions for Tokens.
 *
 * Subclasses generally implement `render`, `onClick`.
 */
export class ActionButton extends Component {
  /**
   * If overridden, must be called via `super.cleanupListeners()`.
   * Fires whenever the underlying action value changes.
   */
  cleanupListeners () {
    if (this.state.action) {
      this.state.action.removeListener('value changed', this.onValueChanged);
    }
  }

  /**
   * If overridden, must be called via `super.connectListeners()`.
   * Fires whenever the underlying action value changes.
   */
  connectListeners () {
    if (this.state.action) {
      this.state.action.on('value changed', this.onValueChanged);
    }
  }

  /**
   * If overridden, must be called via `super.componentWillUnmount()`.
   */
  componentWillUnmount () {
    this.cleanupListeners();
  }

  /**
   * If overridden, must be called via `super.componentWillMount()`.
   */
  componentWillMount () {
    this.processProps(this.props);
    this.connectListeners();
  }

  /**
   * If overridden, must be called via `super.componentWillReceiveProps(nextProps)`.
   *
   * @param {object} nextProps - Incoming properties.
   */
  componentWillReceiveProps (nextProps) {
    this.processProps(nextProps);
  }

  /**
   * If overridden, must be called via `super.processProps(props)`.
   *
   * @param {object} props - Incoming properties.
   */
  processProps (props) {
    propsToState(this, props, [
      {k: 'action'}
    ]);
  }

  /**
   * Called whenever the value of the underlying `Action` changes.
   *
   * @param {object} newVal - The new value.
   * @param {object} oldVal - The previous value.
   */
  @Bind
  onValueChanged (newVal, oldVal) { // eslint-disable-line no-unused-vars
    this.setState({
      actionValue: newVal
    });
  }

  @Bind
  onClick (e) {
    if (this.state.action) {
      e.preventDefault();
      e.stopPropagation();
      this.state.action.onAction();
    }
  }

  /**
   * Render the interactive version of this `Action`, presented only on completed `Token`s.
   *
   * @param {object} props - Properties.
   * @param {object} state - Component state (`this.state`).
   */
  render (props, state) { // eslint-disable-line no-unused-vars
    const {action} = state;
    return <button className='token-action' onMouseDown={this.onClick}>{action.name}</button>;
  }
}
