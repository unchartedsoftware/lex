import { Component } from 'preact';
import { bind } from '../../node_modules/decko/dist/decko';

export class Token extends Component {
  constructor () {
    super(arguments);
    this.state = {
      stateArray: [],
      focused: false,
      machine: undefined,
      builders: undefined,
      requestFocus: () => {},
      requestBlur: () => {},
      requestTransition: () => {},
      requestRewind: () => {}
    };
  }

  processProps (props) {
    const { machine, builders, requestFocus, requestBlur, requestTransition, requestRewind } = props;
    if (machine !== this.state.machine) {
      if (this.state.machine) this.state.machine.removeListener('state changed', this.onStateChanged);
      this.setState({
        machine: machine
      });
      this.state.machine.on('submit', () => console.log('submit')); // TODO deatch when component unmounts
      this.state.machine.on('state changed', this.onStateChanged);
      this.onStateChanged();
    }
    if (builders !== this.state.builders) {
      this.setState({
        builders: builders
      });
    }
    if (requestTransition !== this.state.requestTransition) {
      this.setState({
        requestTransition: requestTransition
      });
    }
    if (requestRewind !== this.state.requestRewind) {
      this.setState({
        requestRewind: requestRewind
      });
    }
    if (requestFocus !== this.state.requestFocus) {
      this.setState({
        requestFocus: requestFocus
      });
    }
    if (requestBlur !== this.state.requestBlur) {
      this.setState({
        requestBlur: requestBlur
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
  onStateChanged () {
    const result = [];
    let current = this.state.machine.state;
    while (current !== undefined) {
      result.unshift(current);
      current = current.parent;
    }
    this.setState({
      stateArray: result
    });
    this.setState({focused: true});
    this.state.requestFocus();
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

  @bind
  requestFocus () {
    this.setState({focused: true});
    this.state.requestFocus();
  }

  @bind
  requestBlur () {
    this.setState({focused: false});
    this.state.requestBlur();
  }

  render (props, {machine, tokens, requestFocus, requestBlur, focused}) {
    return (
      <div className='token'>
        {this.state.stateArray.map(s => {
          const Builder = this.state.builders.getBuilder(s.template.constructor);
          return (<Builder
            machine={machine}
            machineState={s}
            requestTransition={this.state.requestTransition}
            requestRewind={this.state.requestRewind}
            requestFocus={this.requestFocus}
            requestBlur={this.requestBlur}
            readOnly={s !== machine.state}
            blank={this.isBlank}
            focused={s === machine.state && focused} />);
        })}
      </div>
    );
  }
}
