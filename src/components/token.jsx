import { Component } from 'preact';
import { bind } from '../../node_modules/decko/dist/decko';

export class Token extends Component {
  constructor () {
    super(arguments);
    this.state = {
      stateArray: [],
      machine: undefined,
      builders: undefined
    };
  }

  processProps (props) {
    const { machine, builders } = props;
    if (machine !== this.state.machine) {
      if (this.state.machine) this.state.machine.removeListener('state changed', this.getStateArray);
      this.setState({
        machine: machine
      });
      this.state.machine.on('submit', () => console.log('submit')); // TODO deatch when component unmounts
      this.state.machine.on('state changed', this.getStateArray);
      this.getStateArray();
    }
    if (builders !== this.state.builders) {
      this.setState({
        builders: builders
      });
    }
  }

  componentWillUnmount () {
    this.cleanupListeners();
  }

  cleanupListeners () {
    if (this.state.machine) this.state.machine.removeListener('state changed', this.getStateArray);
  }

  componentWillMount () {
    this.processProps(this.props);
  }

  componentWillReceiveProps (nextProps) {
    this.processProps(nextProps);
  }

  @bind
  transition () {
    this.state.machine.transition();
  }

  @bind
  rewind () {
    this.state.machine.rewind();
  }

  @bind
  getStateArray () {
    const result = [];
    let current = this.state.machine.state;
    while (current !== undefined) {
      result.unshift(current);
      current = current.parent;
    }
    this.setState({
      stateArray: result
    });
  }

  get isBlank () {
    return this.state.machine.state === this.state.machine.rootState && (this.state.machine.state.value === null || this.state.machine.state.unboxedValue.length === 0);
  }

  /**
   * Get the values bound to underlying states, up to the current state.
   *
   * @returns {Array[any]} An array of boxed values.
   */
  get value () {
    const result = [];
    let current = this.state.machine.state;
    while (current !== undefined) {
      result.unshift(current.value);
      current = current.parent;
    }
    return result;
  }

  /**
   * Alias for this.value.
   *
   * @returns {Array[any]} An array of boxed values.
   */
  get boxedValue () {
    return this.value;
  }

  /**
   * Get the (unboxed) values bound to underlying states, up to the current state.
   *
   * @returns {Array[String]} An array of unboxed values.
   */
  get unboxedValue () {
    const result = [];
    let current = this.state.machine.state;
    while (current !== undefined) {
      result.unshift(current.unboxedValue);
      current = current.parent;
    }
    return result;
  }

  render (props, {machine, tokens}) {
    return (
      <div className='token'>
        {this.state.stateArray.map(s => {
          const Builder = this.state.builders.getBuilder(s.template.constructor);
          return (<Builder machineState={s} onTransition={this.transition} onRewind={this.rewind} readOnly={s !== machine.state} blank={this.isBlank} />);
        })}
      </div>
    );
  }
}
