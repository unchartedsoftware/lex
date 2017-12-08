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
      tokenValues: [],
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
      });
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

  componentWillUnmount () {
    this.cleanupListeners();
  }

  componentDidUpdate () {
    this.connectListeners();
  }

  componentDidMount () {
    this.connectListeners();
  }

  connectListeners () {
    if (this.state.activeMachine) {
      // TODO emit search change event because we just wiped out the search?
      this.state.activeMachine.on('state changed', this.forceDraw);
    }
  }

  cleanupListeners () {
    if (this.state.activeMachine) {
      this.state.activeMachine.removeListener('state changed', this.forceDraw);
    }
  }

  @bind
  forceDraw () {
    this.forceUpdate();
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
      return true;
    } catch (err) {
      if (err instanceof StateTransitionError) {
        console.error(err.message);
        return false;
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

  @bind
  onEndToken (v) {
    this.setState({
      tokenValues: [...this.state.tokenValues, v]
    });
    this.state.activeMachine.reset();
  }

  render (props, {tokenValues, builders, machineTemplate, activeMachine}) {
    return (
      <div className='lex-box form-control' onKeyDown={this.onKeyDown} tabIndex='0'>
        {
          tokenValues.map(v => {
            return <Token machine={new TokenStateMachine(machineTemplate, v)} builders={builders} />;
          })
        }
        <Token
          active
          machine={activeMachine}
          builders={builders}
          requestFocus={this.focus}
          requestBlur={this.blur}
          requestTransition={this.transition}
          requestRewind={this.rewind}
          onEndToken={this.onEndToken}
        />
        { this.renderAssistant(activeMachine) }
      </div>
    );
  }
}
