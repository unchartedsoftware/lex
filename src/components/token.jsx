import { h, Component } from 'preact';
import { Bind } from 'lodash-decorators';
import { COMMA } from '../lib/keys';
import { propsToState } from '../lib/util';
/**
 * @private
 */
export class Token extends Component {
  processProps (props) {
    propsToState(this, props, [
      {k: 'idx'},
      {k: 'active'},
      {k: 'editing'},
      {k: 'flash'},
      {k: 'suggestion'},
      {k: 'machine', after: () => this.onStateChanged()},
      {k: 'builders'},
      {k: 'tokenXIcon', default: '&times'},
      {k: 'multivalueDelimiter', default: COMMA},
      {k: 'multivaluePasteDelimiter', default: ','},
      {k: 'stateArray', default: []},
      {k: 'cancelOnBlur', default: true},
      {k: 'searchBox'},
      {k: 'requestTransition', default: () => true},
      {k: 'requestEndAndCreateToken', default: () => true},
      {k: 'requestArchive', default: () => true},
      {k: 'requestUnarchive', default: () => true},
      {k: 'requestRemoveArchivedValue', default: () => true},
      {k: 'requestRemoveArchivedValues', default: () => true},
      {k: 'requestUpdateArchivedValue', default: () => true},
      {k: 'requestRewind', default: () => true},
      {k: 'requestFocus', default: () => true},
      {k: 'requestBlur', default: () => true},
      {k: 'requestEdit', default: () => true},
      {k: 'requestCancel', default: () => true},
      {k: 'requestRemoval', default: () => true},
      {k: 'requestAcceptSuggestion', default: () => true},
      {k: 'onEndToken', default: () => true},
      {k: 'onValidityChanged', default: () => true},
      {k: 'onActionValueChanged', default: () => true}
    ]);
  }

  cleanupListeners () {
    if (this._emitter) {
      this._emitter.removeListener('state changed', this.getStateArray);
      this._emitter.removeListener('end', this.endToken);
    }

    // Remove all action listeners on clean up
    if (Array.isArray(this.state.stateArray)) {
      this.state.stateArray.filter(s => s.actions.length > 0).forEach(s => {
        return s.actions.forEach(a => {
          a.removeAllListeners();
        });
      });
    }
  }

  connectListeners () {
    this.cleanupListeners();
    if (this.state.machine) {
      this._emitter = this.state.machine;
      this._emitter.on('end', this.endToken);
      this._emitter.on('state changed', this.onStateChanged);
    }
  }

  componentWillUnmount () {
    this.cleanupListeners();
  }

  componentWillMount () {
    this.processProps(this.props);
  }

  componentDidMount () {
    this.connectListeners();
  }

  componentWillReceiveProps (nextProps) {
    this.processProps(nextProps);
  }

  @Bind
  endToken (state, nextToken) {
    this.state.onEndToken(this.value, nextToken);
  }

  @Bind
  onActionValueChanged (actionVkey, newVal, oldVal) {
    this.state.onActionValueChanged(actionVkey, newVal, oldVal);
    // redraw in case suggested classes changed
    this.forceUpdate();
  }

  @Bind
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
    // this.setState({focused: true});
    if (result[0] && result[0].isDirty) {
      // Only request focus when our first state is dirty
      // This way we don't request focus when the state is reset
      // We only want to request focus when the state change was a result of a transition
      this.state.requestFocus();
    }
  }

  get isBlank () {
    return this.state.machine.state === this.state.machine.rootState && (this.state.machine.state.value === null || this.state.machine.state.unboxedValue.length === 0);
  }

  /**
   * Get the values bound to underlying states, up to the current state.
   *
   * @returns {Object} An object of boxed values.
   */
  get value () {
    return this.state.machine.value;
  }

  /**
   * Alias for this.value.
   *
   * @returns {Object} An object of boxed values.
   */
  get boxedValue () {
    return this.value;
  }

  /**
   * Get the (unboxed) values bound to underlying states, up to the current state.
   *
   * @returns {Object} An object of unboxed values.
   */
  get unboxedValue () {
    return this.state.machine.unboxedValue;
  }

  /*
   * @private
   */
  get icon () {
    let defaultIcon = '<span>&#128269;</span>';
    if (this.state.machine) {
      let st = this.state.machine.state;
      while (st !== undefined) {
        const iconSuggestion = st.suggestIcon();
        if (iconSuggestion !== undefined) {
          defaultIcon = iconSuggestion;
          break;
        }
        st = st.parent;
      }
    }
    return <span className='token-icon' dangerouslySetInnerHTML={{__html: defaultIcon}} />;
  }

  /*
   * @private
   */
  get xicon () {
    return <span dangerouslySetInnerHTML={{__html: this.state.tokenXIcon}} />;
  }

  focus () {
    // this.setState({focused: true});
    setTimeout(() => { if (this.activeBuilder) this.activeBuilder.focus(); }, 10);
  }

  @Bind
  compileBuilderClassHints () {
    let defaultClass = [];
    if (this.state.machine) {
      let st = this.state.machine.state;
      while (st !== undefined) {
        const klassSuggestion = st.suggestCssClass();
        if (Array.isArray(klassSuggestion)) {
          defaultClass = defaultClass.concat(klassSuggestion);
        }
        // add in action suggestions
        st.actions.map(a => {
          const actionKlassSuggestion = a.suggestCssClass();
          if (Array.isArray(actionKlassSuggestion)) {
            defaultClass = defaultClass.concat(actionKlassSuggestion);
          }
        });
        st = st.parent;
      }
    }
    return defaultClass.join(' ');
  }

  @Bind
  requestFocus () {
    this.focus();
    this.state.requestFocus();
  }

  @Bind
  requestBlur () {
    this.state.requestBlur();
  }

  @Bind
  requestCancel (e) {
    if (this.state.editing) {
      this.state.requestCancel();
    } else {
      this.requestRemoval(e);
    }
  }

  @Bind
  requestRemoval (e) {
    e.preventDefault();
    e.stopPropagation();
    if (!this.state.machine.state.isValid) {
      this.state.onValidityChanged(true, this.state.machine.state.isValid);
    }
    this.state.requestRemoval(this.state.idx);
  }

  @Bind
  requestTransition (e, nextToken = !this.state.editing) {
    e.preventDefault();
    e.stopPropagation();
    this.state.requestTransition({nextToken: nextToken});
  }

  @Bind
  requestAcceptSuggestion (e) {
    e.preventDefault();
    e.stopPropagation();
    this.state.requestAcceptSuggestion(this.state.idx);
  }

  @Bind
  requestEdit (e) {
    if (!this.state.active && this.state.requestEdit) {
      e.preventDefault();
      e.stopPropagation();
      if (!this.state.machine.isBindOnly) {
        this.state.requestEdit(this.state.idx);
      }
    }
  }

  get addButton () {
    if (this.state.suggestion) {
      return <button className='token-action-add-suggestion' onClick={this.requestAcceptSuggestion}>ADD</button>;
    }
  }

  get actionButtons () {
    // only show actions when the token is inactive
    if (!this.state.active) {
      const actions = this.state.stateArray.filter(s => s.actions.length > 0).map(s => {
        return s.actions.map(a => {
          // Note this is a bit of a hack... will maybe leak listeners a bit.
          // See Token.cleanupListeners() for where we remove the final listener
          a.removeAllListeners();
          a.on('value changed', this.onActionValueChanged);
          const ActionButton = this.state.builders.getActionButton(a.constructor);
          return (<ActionButton action={a} />);
        });
      });
      return actions.reduce((acc, val) => acc.concat(val), []);
    }
  }

  get lifecycleButtons () {
    const nextLabel = this.state.machine.state.isTerminal ? 'Finish' : 'Next';
    if (!this.state.active) {
      return (<button type='button' onMouseDown={this.requestRemoval} className='btn btn-xs btn-link token-remove' aria-label='Close'>{this.xicon}</button>);
    } else if (this.state.editing) {
      const lifecycle = this.state.machine.state.hideLifecycleInteractions ? '' : <button type='button' onMouseDown={this.requestTransition} className='btn btn-xs btn-default token-next' aria-label='Next'>{nextLabel} &gt;</button>;
      return (
        <span className='button-group'>
          {lifecycle}
          <button type='button' onMouseDown={this.requestCancel} className='btn btn-xs btn-default token-next' aria-label='Cancel Edits'>Cancel</button>
        </span>
      );
    } else {
      const lifecycle = this.state.machine.state.hideLifecycleInteractions ? '' : <button type='button' onMouseDown={(e) => this.requestTransition(e, false)} className={`btn btn-xs ${this.state.machine.state.isTerminal ? 'btn-primary' : 'btn-default'} token-next`} aria-label={nextLabel}>{nextLabel} &gt;</button>;
      return (
        <span className='button-group'>
          {lifecycle}
          <button type='button' onMouseDown={this.requestCancel} className='btn btn-xs btn-link token-cancel' aria-label='Cancel New Token'>{this.xicon}</button>
        </span>
      );
    }
  }

  delegateEvent (e) {
    return this.activeBuilder && this.activeBuilder.delegateEvent(e);
  }

  render (props, {active, flash, cancelOnBlur, suggestion, machine, multivalueDelimiter, multivaluePasteDelimiter, editing}) {
    return (
      <div className='token-container'>
        <div className={`token ${active ? 'active' : ''} ${editing ? 'editing' : ''} ${suggestion ? 'suggestion' : ''} ${flash ? 'anim-flash' : ''} ${machine.isBindOnly ? 'bind-only' : ''} ${this.compileBuilderClassHints()}`} onMouseDown={this.requestEdit}>
          {this.icon}
          {this.state.stateArray.map(s => {
            const Builder = this.state.builders.getBuilder(s.constructor);
            return (<Builder
              key={s.id}
              editing={editing}
              machine={machine}
              machineState={s}
              cancelOnBlur={cancelOnBlur}
              searchBox={this.state.searchBox}
              requestTransition={this.state.requestTransition}
              requestEndAndCreateToken={this.state.requestEndAndCreateToken}
              requestArchive={this.state.requestArchive}
              requestUnarchive={this.state.requestUnarchive}
              requestRemoveArchivedValue={this.state.requestRemoveArchivedValue}
              requestRemoveArchivedValues={this.state.requestRemoveArchivedValues}
              requestUpdateArchivedValue={this.state.requestUpdateArchivedValue}
              requestRewind={this.state.requestRewind}
              requestFocus={this.requestFocus}
              requestBlur={this.requestBlur}
              requestCancel={this.state.requestCancel}
              validityChanged={this.state.onValidityChanged}
              readOnly={!active || s !== machine.state}
              blank={this.isBlank}
              // focused={active && s === machine.state && focused}
              ref={(b) => { if (active && s === machine.state) this.activeBuilder = b; }}
              tokenActive={active}
              multivalueDelimiter={multivalueDelimiter}
              multivaluePasteDelimiter={multivaluePasteDelimiter}
            />);
          })}
          {this.addButton}
          {this.actionButtons}
          {this.lifecycleButtons}
        </div>
      </div>
    );
  }
}
