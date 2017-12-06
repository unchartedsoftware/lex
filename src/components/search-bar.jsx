import { bind } from 'decko';
import { Component } from 'preact';
import { TokenStateMachine } from '../lib/token-state-machine';
import { Token } from './token';

export class SearchBar extends Component {
  constructor () {
    super();
    this.state = {
      tokens: [],
      builders: undefined,
      machineTemplate: undefined,
      machines: undefined,
      focused: false
    };
  }

  processProps (props) {
    const { machineTemplate, builders } = props;
    if (machineTemplate !== this.state.machineTemplate) {
      this.setState({
        machineTemplate: machineTemplate,
        activeMachine: new TokenStateMachine(machineTemplate), // TODO how do we edit tokens?
        machines: this.state.tokens.map(t => new TokenStateMachine(machineTemplate)) // TODO bind incoming values to TokenStateMachine
      });
      // TODO emit search change event because we just wiped out the search?
      this.state.activeMachine.on('state changed', () => this.forceUpdate());
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

  get machineInstance () {
    if (!this.state.machineTemplate) return null;
    return new TokenStateMachine(this.state.machineTemplate);
  }

  renderAssistant (activeMachine) {
    try {
      if (!this.state.focused) return;
      const Assistant = this.state.builders.getAssistant(activeMachine.state.template.constructor);
      return (
        <div className='assistant-box'>
          <Assistant machineState={activeMachine.state} />
        </div>
      );
    } catch (err) {
      // do nothing if there is no assistant.
    }
  }

  @bind
  onFocus () {
    this.setState({focused: true});
  }

  @bind
  onBlur () {
    this.setState({focused: false});
  }

  render (props, {tokens, builders, machines, activeMachine}) {
    return (
      <div className='search-box form-control'>
        { machines.map(m => <Token machine={m} builders={builders} />) }
        <Token machine={activeMachine} builders={builders} onFocus={this.onFocus} onBlur={this.onBlur} />
        { this.renderAssistant(activeMachine) }
      </div>
    );
  }
}
