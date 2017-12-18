import { h, Component } from 'preact';
import { bind } from '../../node_modules/decko/dist/decko';

/**
 * @private
 */
export class Token extends Component {
  constructor () {
    super(arguments);
    this.state = {
      idx: undefined,
      active: false,
      focused: false,
      machine: undefined,
      builders: undefined,
      stateArray: [],
      requestFocus: () => {},
      requestBlur: () => {},
      requestTransition: () => {},
      requestRewind: () => {},
      requestCancel: () => {},
      onEndToken: () => {},
      onValidityChanged: () => {}
    };
  }

  processProps (props) {
    const {
      idx,
      active,
      machine,
      builders,
      requestRemoval = () => {},
      requestFocus = () => {},
      requestBlur = () => {},
      requestCancel = () => {},
      requestTransition = () => {},
      requestRewind = () => {},
      onEndToken = () => {},
      onValidityChanged = () => {}
    } = props;
    if (idx !== this.state.idx) {
      this.setState({
        idx: idx
      });
    }
    if (active !== this.state.active) {
      this.setState({
        active: active
      });
    }
    if (machine !== this.state.machine) {
      this.cleanupListeners();
      this.setState({
        machine: machine
      });
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
    if (requestCancel !== this.state.requestCancel) {
      this.setState({
        requestCancel: requestCancel
      });
    }
    if (requestRemoval !== this.state.requestRemoval) {
      this.setState({
        requestRemoval: requestRemoval
      });
    }
    if (onEndToken !== this.state.onEndToken) {
      this.setState({
        onEndToken: onEndToken
      });
    }
    if (onValidityChanged !== this.state.onValidityChanged) {
      this.setState({
        onValidityChanged: onValidityChanged
      });
    }
  }

  cleanupListeners () {
    if (this.state.machine) {
      this.state.machine.removeListener('state changed', this.getStateArray);
      this.state.machine.removeListener('end', this.endToken);
    }
  }

  connectListeners () {
    if (this.state.machine) {
      this.state.machine.on('end', this.endToken);
      this.state.machine.on('state changed', this.onStateChanged);
    }
  }

  componentWillUnmount () {
    this.cleanupListeners();
  }

  componentDidUpdate () {
    this.connectListeners();
  }

  componentWillMount () {
    this.processProps(this.props);
  }

  componentDidMount () {
    this.connectListeners();
  }

  componentWillReceiveProps (nextProps) {
    this.cleanupListeners();
    this.processProps(nextProps);
  }

  @bind
  endToken () {
    this.state.onEndToken(this.value);
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
    return this.state.machine.value;
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
    return this.state.machine.unboxedValue;
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

  @bind
  requestRemoval (e) {
    e.preventDefault();
    e.stopPropagation();
    this.state.requestRemoval(this.state.idx);
  }

  @bind
  requestCancel () {
    this.state.machine.reset();
    this.state.requestCancel();
  }

  render (props, {active, machine, focused}) {
    return (
      <div className={active ? 'token active' : 'token'}>
        &#128269;
        {this.state.stateArray.map(s => {
          const Builder = this.state.builders.getBuilder(s.template.constructor);
          return (<Builder
            machine={machine}
            machineState={s}
            requestTransition={this.state.requestTransition}
            requestRewind={this.state.requestRewind}
            requestFocus={this.requestFocus}
            requestBlur={this.requestBlur}
            requestCancel={this.requestCancel}
            validityChanged={this.state.onValidityChanged}
            readOnly={!active || s !== machine.state}
            blank={this.isBlank}
            focused={active && s === machine.state && focused} />);
        })}
        <i className='close' onClick={this.requestRemoval} >&times;</i>
      </div>
    );
  }
}
