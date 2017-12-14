import { bind } from 'decko';
import { h, Component } from 'preact';
import Portal from 'preact-portal';
import { TokenStateMachine } from '../lib/token-state-machine';
import { StateTransitionError } from '../lib/errors';
import { Token } from './token';

export class SearchBar extends Component {
  constructor () {
    super();
    this.state = {
      tokenValues: [],
      builders: undefined,
      machineTemplate: undefined,
      machines: undefined,
      active: false,
      focused: false,
      onSubmit: () => {},
      proxiedEvents: new Map()
    };
  }

  processProps (props) {
    const { machineTemplate, builders, value = [], onSubmit, proxiedEvents } = props;
    if (machineTemplate !== this.state.machineTemplate) {
      this.setState({
        machineTemplate: machineTemplate,
        activeMachine: new TokenStateMachine(machineTemplate) // TODO how do we edit tokens?
      });
    }
    if (builders !== this.state.builders) {
      this.setState({
        builders: builders
      });
    }
    if (value !== this.state.tokenValues) {
      this.setState({
        tokenValues: value
      });
    }
    if (onSubmit !== this.state.onSubmit) {
      this.setState({
        onSubmit: onSubmit
      });
    }
    if (proxiedEvents !== this.state.proxiedEvents) {
      this.setState({
        proxiedEvents: proxiedEvents
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

  @bind
  activate () {
    this.setState({active: true});
  }

  get machineInstance () {
    if (!this.state.machineTemplate) return null;
    return new TokenStateMachine(this.state.machineTemplate);
  }

  renderTokenBuilder (activeMachine, builders) {
    if (this.state.active) {
      return (<Token
        active
        machine={activeMachine}
        builders={builders}
        requestFocus={this.focus}
        requestBlur={this.blur}
        requestTransition={this.transition}
        requestRewind={this.rewind}
        requestRemoval={this.removeToken}
        onEndToken={this.onEndToken}
      />);
    }
  }

  renderAssistant (activeMachine) {
    try {
      if (!this.state.active || !this.state.focused) return;
      const Assistant = this.state.builders.getAssistant(activeMachine.state.template.constructor);
      const rect = this.searchBox.getBoundingClientRect();
      const pos = {
        left: rect.left,
        top: rect.top + rect.height,
        'min-width': rect.width
      };
      return (
        <Portal into='body'>
          <div className='assistant-box' style={pos}>
            <Assistant
              machineState={activeMachine.state}
              ref={(a) => { this.assistant = a; }}
              requestTransition={this.transition}
              requestRewind={this.rewind}
            />
          </div>
        </Portal>
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
    if (this.state.activeMachine.rootState.isDefault) {
      this.setState({focused: false, active: false});
    } else {
      this.setState({focused: false});
    }
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
    const oldState = this.state.activeMachine.state;
    const newState = this.state.activeMachine.rewind();
    if (oldState === newState) {
      this.setState({active: false});
    }
  }

  @bind
  onKeyDown (e) {
    this.unboxedValue = e.target.value;
    if (this.assistant && this.state.proxiedEvents.get(e.code) === true) {
      this.assistant.delegateEvent(e);
    }
  }

  @bind
  onEndToken (v) {
    this.setState({
      tokenValues: [...this.state.tokenValues, v]
    });
    this.state.activeMachine.reset();
    this.submit();
  }

  @bind
  removeToken (idx) {
    if (idx === undefined) {
      this.setState({active: false});
    } else {
      this.setState({
        tokenValues: [...this.state.tokenValues.slice(0, idx), ...this.state.tokenValues.slice(idx + 1)]
      });
      this.submit();
    }
  }

  @bind
  submit () {
    this.state.onSubmit(this.state.tokenValues);
  }

  render (props, {focused, tokenValues, builders, machineTemplate, activeMachine}) {
    return (
      <div className={focused ? 'lex-box form-control focused' : 'lex-box form-control'} onKeyDown={this.onKeyDown} onClick={this.activate} tabIndex='0' ref={(a) => { this.searchBox = a; }}>
        {
          tokenValues.map((v, i) => {
            return <Token machine={new TokenStateMachine(machineTemplate, v)} builders={builders} requestRemoval={this.removeToken} idx={i} />;
          })
        }
        { this.renderTokenBuilder(activeMachine, builders) }
        { this.renderAssistant(activeMachine) }
      </div>
    );
  }
}
