import { bind } from 'decko';
import { Component } from 'preact';
import { TokenStateMachine } from '../lib/token-state-machine';
import { StateTransitionError } from '../lib/errors';
import { Token } from './token';

const eventsToDelegate = new Map();
eventsToDelegate.set('ArrowUp', true);
eventsToDelegate.set('ArrowDown', true);
eventsToDelegate.set('Tab', true);

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
          <Assistant
            machineState={activeMachine.state}
            ref={(a) => { this.assistant = a; }}
            requestTransition={this.transition}
            requestRewind={this.rewind}
          />
        </div>
      );
    } catch (err) {
      // do nothing if there is no assistant.
    }
  }

  @bind
  focus () {
    this.setState({focused: true});
  }

  @bind
  blur () {
    this.setState({focused: false});
  }

  @bind
  transition () {
    try {
      this.state.activeMachine.transition();
    } catch (err) {
      if (err instanceof StateTransitionError) {
        console.error(err.message);
      } else {
        throw err;
      }
    }
  }

  @bind
  rewind () {
    this.state.activeMachine.rewind();
  }

  @bind
  onKeyDown (e) {
    this.unboxedValue = e.target.value;
    if (this.assistant && eventsToDelegate.has(e.code) && eventsToDelegate.get(e.code)) {
      this.assistant.delegateEvent(e);
    }
  }

  render (props, {tokens, builders, machines, activeMachine}) {
    return (
      <div className='lex-box form-control' onKeyDown={this.onKeyDown} tabIndex='0'>
        { machines.map(m => <Token machine={m} builders={builders} />) }
        <Token
          machine={activeMachine}
          builders={builders}
          requestFocus={this.focus}
          requestBlur={this.blur}
          requestTransition={this.transition}
          requestRewind={this.rewind}
        />
        { this.renderAssistant(activeMachine) }
      </div>
    );
  }
}
