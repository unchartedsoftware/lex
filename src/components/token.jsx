import { Component } from 'preact';
import { TokenStateMachine } from '../lib/token-state-machine';

export class Token extends Component {
  constructor () {
    super(arguments);
    this.state = {valid: true};
  }

  processProps (props) {
    const { machineTemplate, stateBuilderFactory } = props;
    if (machineTemplate !== this.state.machineTemplate) {
      this.setState({
        machineTemplate: machineTemplate,
        machine: new TokenStateMachine(machineTemplate)
      });
    }
    if (stateBuilderFactory !== this.state.stateBuilderFactory) {
      this.setState({
        stateBuilderFactory: stateBuilderFactory
      });
    }
  }

  componentWillMount () {
    this.processProps(this.props);
  }

  componentWillReceiveProps (nextProps) {
    this.processProps(nextProps);
  }
}
