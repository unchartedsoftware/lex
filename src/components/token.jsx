import { Component } from 'preact';
import { TokenStateMachine } from '../lib/token-state-machine';
import { bind } from '../../node_modules/decko/dist/decko';

export class Token extends Component {
  constructor () {
    super(arguments);
    this.state = {
      stateArray: [],
      machine: undefined,
      machineTemplate: undefined,
      builders: undefined
    };
  }

  processProps (props) {
    const { machineTemplate, builders } = props;
    if (machineTemplate !== this.state.machineTemplate) {
      if (this.state.machine) this.state.machine.removeAllListeners();
      this.setState({
        machineTemplate: machineTemplate,
        machine: new TokenStateMachine(machineTemplate)
      });
      // TODO deatch when component unmounts
      this.state.machine.on('submit', () => console.log('submit'));
      this.state.machine.on('state changed', () => this.getStateArray());
      this.getStateArray();
    }
    if (builders !== this.state.builders) {
      this.setState({
        builders: builders
      });
    }
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

  get blank () {
    return this.state.machine.state === this.state.machine.rootState && (this.state.machine.state.value === null || this.state.machine.state.unboxedValue.length === 0);
  }

  render (props, {machine, tokens}) {
    return (
      <div className='token'>
        {this.state.stateArray.map(s => {
          const Builder = this.state.builders.getBuilder(s.template.constructor);
          return (<Builder machineState={s} onTransition={this.transition} onRewind={this.rewind} readOnly={s !== machine.state} blank={this.blank} />);
        })}
      </div>
    );
  }
}
