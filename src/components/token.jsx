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
      {k: 'flash'},
      {k: 'suggestion'},
      {k: 'machine', after: () => this.onStateChanged()},
      {k: 'builders'},
      {k: 'tokenXIcon', default: '&times'},
      {k: 'multivalueDelimiter', default: COMMA},
      {k: 'multivaluePasteDelimiter', default: ','},
      {k: 'stateArray', default: []},
      {k: 'requestTransition', default: () => true},
      {k: 'requestArchive', default: () => true},
      {k: 'requestUnarchive', default: () => true},
      {k: 'requestRemoveArchivedValue', default: () => true},
      {k: 'requestRewind', default: () => true},
      {k: 'requestFocus', default: () => true},
      {k: 'requestBlur', default: () => true},
      {k: 'requestEdit', default: () => true},
      {k: 'requestCancel', default: () => true},
      {k: 'requestRemoval', default: () => true},
      {k: 'requestAcceptSuggestion', default: () => true},
      {k: 'onEndToken', default: () => true},
      {k: 'onValidityChanged', default: () => true}
    ]);
  }

  cleanupListeners () {
    if (this._emitter) {
      this._emitter.removeListener('state changed', this.getStateArray);
      this._emitter.removeListener('end', this.endToken);
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
    this.state.requestFocus();
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
  requestFocus () {
    this.focus();
    this.state.requestFocus();
  }

  @Bind
  requestBlur () {
    // this.setState({focused: false});
    this.state.requestBlur();
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

  render (props, {active, flash, suggestion, machine, multivalueDelimiter, multivaluePasteDelimiter}) {
    return (
      <div data-test='token-container' className={`token ${active ? 'active' : ''} ${suggestion ? 'suggestion' : ''} ${flash ? 'anim-flash' : ''} ${machine.isBindOnly ? 'bind-only' : ''}`} onMouseDown={this.requestEdit}>
        {this.icon}
        {this.state.stateArray.map(s => {
          const Builder = this.state.builders.getBuilder(s.constructor);
          return (<Builder
            key={s.id}
            machine={machine}
            machineState={s}
            requestTransition={this.state.requestTransition}
            requestArchive={this.state.requestArchive}
            requestUnarchive={this.state.requestUnarchive}
            requestRemoveArchivedValue={this.state.requestRemoveArchivedValue}
            requestRemoveArchivedValues={this.state.requestRemoveArchivedValues}
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
        <button type='button' onMouseDown={this.requestRemoval} className='btn btn-xs btn-link token-remove' aria-label='Close'>
          {this.xicon}
        </button>
      </div>
    );
  }
}
