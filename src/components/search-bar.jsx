import { Bind } from 'lodash-decorators';
import { h, Component } from 'preact';
import Portal from 'preact-portal';
import { TokenStateMachine } from '../lib/token-state-machine';
import { StateTransitionError, ValueArchiveError } from '../lib/errors';
import { Token } from './token';
import { normalizeKey, COMMA } from '../lib/keys';
import ElementResizeDetector from 'element-resize-detector';
import { propsToState } from '../lib/util';

const _erd = new WeakMap();

/**
 * @private
 */
export class SearchBar extends Component {
  processProps (props) {
    propsToState(this, props, [
      {k: 'enabled', default: true},
      {k: 'placeholder', default: ''},
      {k: 'popupContainer', default: 'body'},
      {
        k: 'machineTemplate',
        before: () => this.cleanupListeners,
        after: (machineTemplate) => {
          this.setState({
            activeMachine: new TokenStateMachine(machineTemplate)
          }, () => this.connectListeners);
        }
      },
      {k: 'builders'},
      {k: 'value', default: []},
      {k: 'value', sk: 'tokenValues', default: []},
      {
        k: 'suggestions',
        default: [],
        transform: (iv) => {
          return iv.map(v => {
            const m = new TokenStateMachine(this.state.machineTemplate);
            m.bindValues(v);
            return m;
          });
        }
      },
      {k: 'onAcceptSuggestion', default: (s) => s},
      {k: 'onRejectSuggestion', default: () => true},
      {k: 'onQueryChanged', default: () => undefined},
      {k: 'onSuggestionsChanged', default: () => undefined},
      {k: 'onValidityChanged', default: () => undefined},
      {k: 'proxiedEvents'},
      {k: 'tokenXIcon', default: '&times'},
      {k: 'cssClass', default: []},
      {k: 'cancelOnBlur', default: true},
      {k: 'multivalueDelimiter', default: COMMA},
      {k: 'multivaluePasteDelimiter', default: ','},
      {k: 'onStartToken', default: () => undefined},
      {k: 'onEndToken', default: () => undefined},
      {k: 'onTokenAction', default: () => undefined}
    ]);
  }

  async setValue (newValue, shouldFireChangeEvent = true) {
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
    if (shouldFireChangeEvent) {
      this.queryChanged(oldQueryValues, false);
    }
  }

  async setSuggestions (newSuggestions, shouldFireChangeEvent = true) {
    const oldSuggestions = this.state.suggestions;
    this.blur();
    const suggestions = await Promise.all(newSuggestions.map(v => {
      const machine = new TokenStateMachine(this.state.machineTemplate);
      return machine.bindValues(v);
    }));
    this.setState({
      suggestions: suggestions
    });
    if (shouldFireChangeEvent) {
      this.suggestionsChanged(oldSuggestions);
    }
  }

  componentWillMount () {
    this.processProps(this.props);
  }

  componentDidMount () {
    if (!_erd.has(this)) _erd.set(this, ElementResizeDetector({ strategy: 'scroll' }));
    _erd.get(this).listenTo(this.searchBox, this.forceDraw);
    window.addEventListener('resize', this.forceDraw);
  }

  componentWillUnmount () {
    if (_erd.has(this)) _erd.get(this).removeAllListeners(this.searchBox);
    window.removeEventListener('resize', this.forceDraw);
  }

  componentWillReceiveProps (nextProps) {
    this.processProps(nextProps);
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

  @Bind
  forceDraw () {
    this.forceUpdate();
  }

  @Bind
  activate () {
    const wasActive = this.state.active;
    if (!wasActive) {
      this.setState({active: true});
      setTimeout(() => this.tokenBuilder && this.tokenBuilder.focus(), 10);
      this.state.activeMachine.reset();
      this.state.onStartToken();
    }
  }

  get machineInstance () {
    if (!this.state.machineTemplate) return null;
    return new TokenStateMachine(this.state.machineTemplate);
  }

  get assistantPosition () {
    const rect = this.searchBox.getBoundingClientRect();
    const pos = {
      left: rect.left,
      top: rect.top + rect.height,
      'min-width': rect.width,
      'max-width': rect.width
    };
    if (this.state.popupContainer !== 'body') {
      const popupContainerElem = typeof this.state.popupContainer === 'string'
        ? document.querySelector(this.state.popupContainer)
        : this.state.popupContainer;
      const popupRect = popupContainerElem.getBoundingClientRect();
      pos.left = pos.left - popupRect.left;
      pos.top = pos.top - popupRect.top;
    }
    return pos;
  }

  renderTokenBuilder (activeMachine, builders) {
    if (this.state.active) {
      return (<Token
        key={activeMachine.id}
        active
        editing={this.state.editing}
        flash={this.state.flashActive}
        tokenXIcon={this.state.tokenXIcon}
        multivalueDelimiter={this.state.multivalueDelimiter}
        multivaluePasteDelimiter={this.state.multivaluePasteDelimiter}
        machine={activeMachine}
        builders={builders}
        cancelOnBlur={this.state.cancelOnBlur}
        requestFocus={this.focus}
        requestBlur={this.blur}
        requestCancel={this.cancel}
        requestTransition={this.transition}
        requestArchive={this.archive}
        requestUnarchive={this.unarchive}
        requestRemoveArchivedValue={this.removeArchivedValue}
        requestRemoveArchivedValues={this.removeArchivedValues}
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
      const Assistant = this.state.builders.getAssistant(activeMachine.state.constructor);
      // See portal bug workaround for why we have a ref that we dont use
      // https://github.com/developit/preact-portal/issues/2
      return (
        <Portal into={this.state.popupContainer} ref={(r) => { this._portal = r; }}>
          <div id='lex-assistant-box' className={`lex-assistant-box ${this.state.cssClass.join(' ')}`} style={this.assistantPosition} ref={(r) => { this._portalAssistant = r; }}>
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
              requestRemoveArchivedValues={this.removeArchivedValues}
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

  @Bind
  setEnabled (enabled) {
    if (!enabled) {
      this.blur();
    }
    this.setState({
      enabled: enabled
    });
  }

  @Bind
  focus () {
    this.setState({focused: true});
    if (this.state.active) {
      if (this.tokenBuilder) this.tokenBuilder.focus();
    } else {
      this.activate();
    }
  }

  @Bind
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

  @Bind
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

  @Bind
  transition (options) {
    try {
      this.state.activeMachine.transition(options);
      return true;
    } catch (err) {
      if (err instanceof StateTransitionError) {
        return false;
      } else {
        throw err;
      }
    }
  }

  @Bind
  archive () {
    try {
      this.state.activeMachine.archive(this.state.activeMachine.boxedValue);
      return true;
    } catch (err) {
      if (err instanceof ValueArchiveError) {
        console.error(err.message); // eslint-disable-line no-console
        return false;
      } else {
        throw err;
      }
    }
  }

  @Bind
  unarchive () {
    try {
      this.state.activeMachine.unarchive(this.state.activeMachine.boxedValue);
      return true;
    } catch (err) {
      if (err instanceof ValueArchiveError) {
        console.error(err.message); // eslint-disable-line no-console
        return false;
      } else {
        throw err;
      }
    }
  }

  @Bind
  removeArchivedValue (idx) {
    try {
      this.state.activeMachine.removeArchivedValue(idx, this.state.activeMachine.boxedValue);
      return true;
    } catch (err) {
      if (err instanceof ValueArchiveError) {
        console.error(err.message); // eslint-disable-line no-console
        return false;
      } else {
        throw err;
      }
    }
  }

  @Bind
  removeArchivedValues () {
    try {
      this.state.activeMachine.removeArchivedValues();
      return true;
    } catch (err) {
      if (err instanceof ValueArchiveError) {
        console.error(err.message); // eslint-disable-line no-console
        return false;
      } else {
        throw err;
      }
    }
  }

  @Bind
  rewind (targetState) {
    const oldState = this.state.activeMachine.state;
    const newState = this.state.activeMachine.rewind(targetState);
    if (oldState === newState) {
      if (this.state.editing) {
        this.queryChanged(this.state.editing, false);
      }
      this.setState({active: false, editing: false, flashActive: false});
    }
  }

  @Bind
  onKeyDown (e) {
    this.unboxedValue = e.target.value;
    const code = normalizeKey(e);
    if (this.assistant && this.state.proxiedEvents.get(code) === true) {
      this.assistant.delegateEvent(e);
    }
  }

  @Bind
  onActionValueChanged (idx) {
    return (actionVkey, newVal, oldVal) => {
      const newUnboxedValues = this.state.tokenValues.map(bv => bv.unboxedValue);
      this.state.onTokenAction(idx, actionVkey, this.state.tokenValues.map(t => t.value), newUnboxedValues, oldVal);
    };
  }

  @Bind
  onEndToken (v, nextToken) {
    const oldQueryValues = this.state.tokenValues;
    const newMachine = new TokenStateMachine(this.state.machineTemplate);
    newMachine.bindValues(v).then(() => {
      this.setState({
        editing: false,
        flashActive: false,
        tokenValues: [...this.state.tokenValues, newMachine]
      }, () => {
        this.state.activeMachine.reset();
        this.queryChanged(oldQueryValues, nextToken);
        this.state.onEndToken();
        if (nextToken) {
          setTimeout(() => this.activate());
        } else {
          setTimeout(() => this.blur());
        }
      });
    });
  }

  @Bind
  removeToken (idx) {
    if (idx === undefined) {
      // We were editing a token when we decided to remove it
      // this is actually a cancel action
      this.cancel();
      this.setState({
        flashActive: false
      });
    } else {
      const oldQueryValues = this.state.tokenValues;
      this.setState({
        tokenValues: [...this.state.tokenValues.slice(0, idx), ...this.state.tokenValues.slice(idx + 1)],
        flashActive: false
      });
      this.queryChanged(oldQueryValues, false);
    }
  }

  @Bind
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

  @Bind
  rejectSuggestion (idx) {
    const oldSuggestions = this.state.suggestions;
    const suggestion = this.state.suggestions[idx];
    if (this.state.onRejectSuggestion(suggestion.value, idx)) {
      this.setState({
        suggestions: [...this.state.suggestions.slice(0, idx), ...this.state.suggestions.slice(idx + 1)]
      });
      this.suggestionsChanged(oldSuggestions);
    }
  }

  @Bind
  acceptSuggestion (idx) {
    const oldSuggestions = this.state.suggestions;
    const boxedSuggestionValue = this.state.onAcceptSuggestion(this.state.suggestions[idx].value, idx);
    if (boxedSuggestionValue !== null && boxedSuggestionValue !== undefined) {
      this.setState({
        suggestions: [...this.state.suggestions.slice(0, idx), ...this.state.suggestions.slice(idx + 1)]
      });
      this.onEndToken(boxedSuggestionValue);
      this.suggestionsChanged(oldSuggestions);
    }
  }

  @Bind
  queryChanged (oldQueryValues = [], nextToken = false) {
    const newUnboxedValues = this.state.tokenValues.map(bv => bv.unboxedValue);
    const oldUnboxedValues = oldQueryValues.map(bv => bv.unboxedValue);
    this.state.onQueryChanged(this.state.tokenValues.map(t => t.value), oldQueryValues.map(t => t.value), newUnboxedValues, oldUnboxedValues, nextToken);
  }

  @Bind
  suggestionsChanged (oldSuggestionValues = []) {
    const newUnboxedValues = this.state.suggestions.map(bv => bv.unboxedValue);
    const oldUnboxedValues = oldSuggestionValues.map(bv => bv.unboxedValue);
    this.state.onSuggestionsChanged(this.state.suggestions.map(t => t.value), oldSuggestionValues.map(t => t.value), newUnboxedValues, oldUnboxedValues);
  }

  render (props, {placeholder, active, focused, enabled, tokenValues, suggestions, builders, activeMachine, tokenXIcon, cssClass, cancelOnBlur, multivalueDelimiter, multivaluePasteDelimiter}) {
    return (
      <div className={`lex-box form-control ${cssClass.join(' ')}` + (active && enabled ? ' active' : '') + (focused && enabled ? ' focused' : '') + (!enabled ? ' disabled' : '')} onKeyDown={this.onKeyDown} onMouseDown={this.activate} onFocus={this.activate} tabIndex='0' ref={(a) => { this.searchBox = a; }}>
        { !active && placeholder !== undefined && tokenValues.length === 0 && suggestions.length === 0 ? <div className='text-muted lex-placeholder'>{ placeholder }</div> : '' }
        {
          tokenValues.map((v, i) => {
            return <Token key={v.id} tokenXIcon={tokenXIcon} multivalueDelimiter={multivalueDelimiter} multivaluePasteDelimiter={multivaluePasteDelimiter} machine={v} builders={builders} cancelOnBlur={cancelOnBlur} requestRemoval={this.removeToken} requestEdit={this.editToken} onActionValueChanged={this.onActionValueChanged(i)} idx={i} />;
          })
        }
        {
          suggestions.map((v, j) => {
            return <Token key={v.id} tokenXIcon={tokenXIcon} multivalueDelimiter={multivalueDelimiter} multivaluePasteDelimiter={multivaluePasteDelimiter} machine={v} builders={builders} cancelOnBlur={cancelOnBlur} requestRemoval={this.rejectSuggestion} requestAcceptSuggestion={this.acceptSuggestion} onActionValueChanged={this.onActionValueChanged(i)} idx={j} suggestion />;
          })
        }
        { this.renderTokenBuilder(activeMachine, builders) }
        { this.renderAssistant(activeMachine) }
      </div>
    );
  }
}
