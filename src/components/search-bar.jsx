import { bind } from 'decko';
import { h, Component } from 'preact';
import Portal from 'preact-portal';
import { TokenStateMachine } from '../lib/token-state-machine';
import { StateTransitionError } from '../lib/errors';
import { Token } from './token';

/**
 * @private
 */
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
      onQueryChanged: () => {},
      onValidityChanged: () => {},
      onStartToken: () => {},
      onEndToken: () => {},
      proxiedEvents: new Map()
    };
  }

  processProps (props) {
    const {
      machineTemplate,
      builders,
      value = [],
      proxiedEvents,
      onQueryChanged = () => {},
      onValidityChanged = () => {},
      onStartToken = () => {},
      onEndToken = () => {}
    } = props;
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
    if (onQueryChanged !== this.state.onQueryChanged) {
      this.setState({
        onQueryChanged: onQueryChanged
      });
    }
    if (onValidityChanged !== this.state.onValidityChanged) {
      this.setState({
        onValidityChanged: onValidityChanged
      });
    }
    if (proxiedEvents !== this.state.proxiedEvents) {
      this.setState({
        proxiedEvents: proxiedEvents
      });
    }
    if (onStartToken !== this.state.onStartToken) {
      this.setState({
        onStartToken: onStartToken
      });
    }
    if (onEndToken !== this.state.onEndToken) {
      this.setState({
        onEndToken: onEndToken
      });
    }
  }

  set value (newValue) {
    this.blur();
    this.setState({
      tokenValues: newValue,
      activeMachine: new TokenStateMachine(this.state.machineTemplate)
    });
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
    this.state.onStartToken();
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
        requestCancel={this.cancel}
        requestTransition={this.transition}
        requestRewind={this.rewind}
        requestRemoval={this.removeToken}
        onEndToken={this.onEndToken}
        onValidityChanged={this.state.onValidityChanged}
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
          <div id='assistant-box' className='assistant-box' style={pos}>
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
      const {focused, active} = this.state;
      this.setState({focused: false, active: false});
      if (focused !== this.state.focused || active !== this.state.active) {
        this.state.onEndToken();
      }
    } else {
      this.setState({focused: false});
    }
  }

  @bind
  cancel () {
    this.setState({focused: false, active: false});
    this.state.onEndToken();
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
    const oldQueryValues = this.state.tokenValues;
    this.setState({
      tokenValues: [...this.state.tokenValues, v],
      activeMachine: new TokenStateMachine(this.state.machineTemplate)
    });
    this.queryChanged(oldQueryValues);
    this.state.onEndToken();
    this.state.onStartToken();
  }

  @bind
  removeToken (idx) {
    if (idx === undefined) {
      this.setState({active: false});
    } else {
      const oldQueryValues = this.state.tokenValues;
      this.setState({
        tokenValues: [...this.state.tokenValues.slice(0, idx), ...this.state.tokenValues.slice(idx + 1)]
      });
      this.queryChanged(oldQueryValues);
    }
  }

  @bind
  queryChanged (oldQueryValues = []) {
    this.state.onQueryChanged(this.state.tokenValues, oldQueryValues);
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
