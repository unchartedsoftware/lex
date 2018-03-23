import { bind } from 'decko';
import { h, Component } from 'preact';
import Portal from 'preact-portal';
import { TokenStateMachine } from '../lib/token-state-machine';
import { StateTransitionError, ValueArchiveError } from '../lib/errors';
import { Token } from './token';
import { COMMA } from '../lib/keys';

/**
 * @private
 */
export class SearchBar extends Component {
  constructor () {
    super();
    this.state = {
      placeholder: undefined,
      tokenValues: [],
      suggestions: [],
      builders: undefined,
      machineTemplate: undefined,
      machines: undefined,
      active: false,
      editing: false,
      focused: false,
      flashActive: false,
      tokenXIcon: '&times',
      multivalueDelimiter: COMMA,
      multivaluePasteDelimiter: ',',
      onQueryChanged: () => {},
      onSuggestionsChanged: () => {},
      onValidityChanged: () => {},
      onStartToken: () => {},
      onEndToken: () => {},
      proxiedEvents: new Map()
    };
  }

  processProps (props) {
    const {
      placeholder,
      machineTemplate,
      builders,
      value = [],
      suggestions = [],
      proxiedEvents,
      tokenXIcon = '&times;',
      multivalueDelimiter = COMMA,
      multivaluePasteDelimiter = ',',
      onQueryChanged = () => {},
      onSuggestionsChanged = () => {},
      onValidityChanged = () => {},
      onStartToken = () => {},
      onEndToken = () => {}
    } = props;
    if (placeholder !== this.state.placeholder) {
      this.setState({
        placeholder: placeholder
      });
    }
    if (machineTemplate !== this.state.machineTemplate) {
      this.cleanupListeners();
      this.setState({
        machineTemplate: machineTemplate,
        activeMachine: new TokenStateMachine(machineTemplate)
      });
      this.connectListeners();
    }
    if (builders !== this.state.builders) {
      this.setState({
        builders: builders
      });
    }
    if (value !== this.state.tokenValues) {
      this.setState({
        tokenValues: value.map(v => new TokenStateMachine(this.state.machineTemplate, v)) // box incoming values
      });
    }
    if (suggestions !== this.state.suggestions) {
      this.setState({
        suggestions: suggestions.map(v => new TokenStateMachine(this.state.machineTemplate, v)) // box incoming values
      });
    }
    if (onQueryChanged !== this.state.onQueryChanged) {
      this.setState({
        onQueryChanged: onQueryChanged
      });
    }
    if (onSuggestionsChanged !== this.state.onSuggestionsChanged) {
      this.setState({
        onSuggestionsChanged: onSuggestionsChanged
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
    if (tokenXIcon !== this.state.tokenXIcon) {
      this.setState({
        tokenXIcon: tokenXIcon
      });
    }
    if (parseInt(multivalueDelimiter) !== this.state.multivalueDelimiter) {
      this.setState({
        multivalueDelimiter: parseInt(multivalueDelimiter)
      });
    }
    if (multivaluePasteDelimiter !== this.state.multivaluePasteDelimiter) {
      this.setState({
        multivaluePasteDelimiter: multivaluePasteDelimiter
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

  async setValue (newValue) {
    const oldQueryValues = this.state.tokenValues;
    this.blur();
    const tokens = await Promise.all(newValue.map(v => {
      const machine = new TokenStateMachine(this.state.machineTemplate);
      return machine.bindValues(v);
    }));
    this.state.activeMachine.reset();
    this.setState({
      tokenValues: tokens,
      focused: false,
      active: false,
      editing: false
    });
    this.queryChanged(oldQueryValues);
  }

  async setSuggestions (newSuggestions) {
    const oldSuggestions = this.state.suggestions;
    this.blur();
    const suggestions = await Promise.all(newSuggestions.map((v) => {
      const machine = new TokenStateMachine(this.state.machineTemplate);
      return machine.bindValues(v);
    }));
    this.setState({
      suggestions: suggestions
    });
    this.suggestionsChanged(oldSuggestions);
  }

  componentWillMount () {
    this.processProps(this.props);
  }

  componentWillReceiveProps (nextProps) {
    this.processProps(nextProps);
  }

  connectListeners () {
    if (this.state.activeMachine) {
      // TODO emit search change event because we just wiped out the search?
      this.state.activeMachine.on('state changed', this.forceDraw);
    }
    window.addEventListener('resize', this.forceDraw);
  }

  cleanupListeners () {
    if (this.state.activeMachine) {
      this.state.activeMachine.removeListener('state changed', this.forceDraw);
    }
    window.removeEventListener('resize', this.forceDraw);
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
        editing={this.state.editing}
        flash={this.state.flashActive}
        tokenXIcon={this.state.tokenXIcon}
        multivalueDelimiter={this.state.multivalueDelimiter}
        multivaluePasteDelimiter={this.state.multivaluePasteDelimiter}
        machine={activeMachine}
        builders={builders}
        requestFocus={this.focus}
        requestBlur={this.blur}
        requestCancel={this.cancel}
        requestTransition={this.transition}
        requestArchive={this.archive}
        requestUnarchive={this.unarchive}
        requestRemoveArchivedValue={this.removeArchivedValue}
        requestRewind={this.rewind}
        requestRemoval={this.removeToken}
        onEndToken={this.onEndToken}
        onValidityChanged={this.state.onValidityChanged}
        ref={(a) => { this.tokenBuilder = a; }}
      />);
    }
  }

  renderAssistant (activeMachine) {
    try {
      if (!this.state.editing && (!this.state.active || !this.state.focused)) return;
      const Assistant = this.state.builders.getAssistant(activeMachine.state.template.constructor);
      const rect = this.searchBox.getBoundingClientRect();
      const pos = {
        left: rect.left,
        top: rect.top + rect.height,
        'min-width': rect.width,
        'max-width': rect.width
      };
      // See portal bug workaround for why we have a ref that we dont use
      // https://github.com/developit/preact-portal/issues/2
      return (
        <Portal into='body' ref={(r) => { this._portal = r; }}>
          <div id='lex-assistant-box' className='lex-assistant-box' style={pos} ref={(r) => { this._portalAssistant = r; }}>
            <Assistant
              editing={this.state.editing}
              machine={activeMachine}
              machineState={activeMachine.state}
              ref={(a) => { this.assistant = a; }}
              multivalueDelimiter={this.state.multivalueDelimiter}
              multivaluePasteDelimiter={this.searchBox.multivaluePasteDelimiter}
              requestFocus={this.focus}
              requestBlur={this.blur}
              requestCancel={this.cancel}
              requestTransition={this.transition}
              requestArchive={this.archive}
              requestUnarchive={this.unarchive}
              requestRemoveArchivedValue={this.removeArchivedValue}
              requestRewind={this.rewind}
              requestRemoval={this.removeToken}
              onEndToken={this.onEndToken}
              onValidityChanged={this.state.onValidityChanged}
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
    if (this.state.active) {
      if (this.tokenBuilder) this.tokenBuilder.focus();
    } else {
      this.activate();
    }
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
    const wasEditing = this.state.editing;
    this.state.activeMachine.reset();
    if (wasEditing) {
      this.setState({focused: false, active: false, editing: false, tokenValues: wasEditing});
      setTimeout(() => this.blur()); // TODO this is a cheat. DO IT PROPERLY.
    } else {
      this.setState({focused: false, active: false, editing: false});
      this.state.onEndToken();
    }
  }

  @bind
  transition () {
    try {
      this.state.activeMachine.transition();
      return true;
    } catch (err) {
      if (err instanceof StateTransitionError) {
        return false;
      } else {
        throw err;
      }
    }
  }

  @bind
  archive () {
    try {
      this.state.activeMachine.archive();
      return true;
    } catch (err) {
      if (err instanceof ValueArchiveError) {
        console.error(err.message);
        return false;
      } else {
        throw err;
      }
    }
  }

  @bind
  unarchive () {
    try {
      this.state.activeMachine.unarchive();
      return true;
    } catch (err) {
      if (err instanceof ValueArchiveError) {
        console.error(err.message);
        return false;
      } else {
        throw err;
      }
    }
  }

  @bind
  removeArchivedValue (idx) {
    try {
      this.state.activeMachine.removeArchivedValue(idx);
      return true;
    } catch (err) {
      if (err instanceof ValueArchiveError) {
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
      if (this.state.editing) {
        this.queryChanged(this.state.editing);
      }
      this.setState({active: false, editing: false, flashActive: false});
    }
  }

  @bind
  onKeyDown (e) {
    this.unboxedValue = e.target.value;
    const code = e.keyCode;
    if (this.assistant && this.state.proxiedEvents.get(code) === true) {
      this.assistant.delegateEvent(e);
    }
  }

  @bind
  onEndToken (v) {
    const oldQueryValues = this.state.tokenValues;
    const newMachine = new TokenStateMachine(this.state.machineTemplate);
    newMachine.bindValues(v).then(() => {
      this.setState({
        editing: false,
        flashActive: false,
        tokenValues: [...this.state.tokenValues, newMachine]
      });
      this.state.activeMachine.reset();
      this.queryChanged(oldQueryValues);
      this.state.onEndToken();
      this.state.onStartToken();
    });
  }

  @bind
  removeToken (idx) {
    if (idx === undefined) {
      // We were editing a token when we decided to remove it
      // this is actually a cancel action
      this.cancel();
    } else {
      const oldQueryValues = this.state.tokenValues;
      this.setState({
        tokenValues: [...this.state.tokenValues.slice(0, idx), ...this.state.tokenValues.slice(idx + 1)]
      });
      this.queryChanged(oldQueryValues);
    }
  }

  @bind
  editToken (idx) {
    if (!this.state.active && idx >= 0) {
      const toEdit = this.state.tokenValues[idx];
      this.setState({
        active: true,
        editing: this.state.tokenValues,
        tokenValues: [...this.state.tokenValues.slice(0, idx), ...this.state.tokenValues.slice(idx + 1)]
      });
      this.state.activeMachine.bindValues(toEdit.value).then(() => {
        // hack to push the current value back into the archive when editing starts in the multivalue case
        if (this.state.activeMachine.state.isMultivalue) this.state.activeMachine.archive();
      });
    } else if (this.state.active) {
      this.setState({
        flashActive: false
      });
      setTimeout(() => {
        this.setState({
          flashActive: true
        });
      });
    }
  }

  @bind
  removeSuggestion (idx) {
    const oldSuggestions = this.state.suggestions;
    this.setState({
      suggestions: [...this.state.suggestions.slice(0, idx), ...this.state.suggestions.slice(idx + 1)]
    });
    this.suggestionsChanged(oldSuggestions);
  }

  @bind
  addSuggestion (idx) {
    const oldSuggestions = this.state.suggestions;
    const suggestion = this.state.suggestions[idx];
    this.removeSuggestion(idx);
    this.onEndToken(suggestion && suggestion.value);
    this.suggestionsChanged(oldSuggestions);
  }

  @bind
  queryChanged (oldQueryValues = []) {
    const newUnboxedValues = this.state.tokenValues.map(bv => bv.unboxedValue);
    const oldUnboxedValues = oldQueryValues.map(bv => bv.unboxedValue);
    this.state.onQueryChanged(this.state.tokenValues.map(t => t.value), oldQueryValues, newUnboxedValues, oldUnboxedValues);
  }

  @bind
  suggestionsChanged (oldSuggestionValues = []) {
    const newUnboxedValues = this.state.suggestions.map(bv => new TokenStateMachine(this.state.machineTemplate, bv).unboxedValue);
    const oldUnboxedValues = oldSuggestionValues.map(bv => new TokenStateMachine(this.state.machineTemplate, bv).unboxedValue);
    this.state.onSuggestionsChanged(this.state.suggestions, oldSuggestionValues, newUnboxedValues, oldUnboxedValues);
  }

  render (props, {placeholder, active, focused, tokenValues, suggestions, builders, activeMachine, tokenXIcon, multivalueDelimiter, multivaluePasteDelimiter}) {
    return (
      <div className={'lex-box form-control' + (active ? ' active' : '') + (focused ? ' focused' : '')} onKeyDown={this.onKeyDown} onMouseDown={this.activate} onFocus={this.activate} tabIndex='0' ref={(a) => { this.searchBox = a; }}>
        { !active && placeholder !== undefined && tokenValues.length === 0 && suggestions.length === 0 ? <div className='text-muted lex-placeholder'>{ placeholder }</div> : '' }
        {
          tokenValues.map((v, i) => {
            return <Token tokenXIcon={tokenXIcon} multivalueDelimiter={multivalueDelimiter} multivaluePasteDelimiter={multivaluePasteDelimiter} machine={v} builders={builders} requestRemoval={this.removeToken} requestEdit={this.editToken} idx={i} focused={false} />;
          })
        }
        {
          suggestions.map((v, j) => {
            return <Token tokenXIcon={tokenXIcon} multivalueDelimiter={multivalueDelimiter} multivaluePasteDelimiter={multivaluePasteDelimiter} machine={v} builders={builders} requestRemoval={this.removeSuggestion} requestAddSuggestion={this.addSuggestion} idx={j} suggestion />;
          })
        }
        { this.renderTokenBuilder(activeMachine, builders) }
        { this.renderAssistant(activeMachine) }
      </div>
    );
  }
}
