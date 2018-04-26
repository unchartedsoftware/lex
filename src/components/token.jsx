import { h, Component } from 'preact';
import { bind } from '../../node_modules/decko/dist/decko';
import { COMMA } from '../lib/keys';
/**
 * @private
 */
export class Token extends Component {
  constructor () {
    super(arguments);
    this._id = Math.random();
    this.state = {
      idx: undefined,
      active: false,
      focused: false,
      flash: false,
      suggestion: false,
      machine: undefined,
      builders: undefined,
      stateArray: [],
      tokenXIcon: '&times',
      multivalueDelimiter: COMMA,
      multivaluePasteDelimiter: ',',
      requestFocus: () => {},
      requestBlur: () => {},
      requestEdit: () => {},
      requestTransition: () => {},
      requestArchive: () => {},
      requestUnarchive: () => {},
      requestRemoveArchivedValue: () => {},
      requestRewind: () => {},
      requestCancel: () => {},
      requestAddSuggestion: () => {},
      onEndToken: () => {},
      onValidityChanged: () => {}
    };
  }

  processProps (props) {
    const {
      idx,
      active,
      flash,
      suggestion,
      machine,
      builders,
      tokenXIcon = '&times',
      multivalueDelimiter = COMMA,
      multivaluePasteDelimiter = ',',
      requestRemoval = () => {},
      requestFocus = () => {},
      requestBlur = () => {},
      requestEdit = () => {},
      requestCancel = () => {},
      requestTransition = () => {},
      requestArchive = () => {},
      requestUnarchive = () => {},
      requestRemoveArchivedValue = () => {},
      requestRewind = () => {},
      requestAddSuggestion = () => {},
      onEndToken = () => {},
      onValidityChanged = () => {}
    } = props;
    if (idx !== this.state.idx) {
      this.setState({
        idx: idx
      });
    }
    if (active !== this.state.active) {
      this.setState({
        active: active
      });
    }
    if (flash !== this.state.flash) {
      this.setState({
        flash: flash
      });
    }
    if (suggestion !== this.state.suggestion) {
      this.setState({
        suggestion: suggestion
      });
    }
    if (machine !== this.state.machine) {
      this.setState({
        machine: machine
      });
      this.onStateChanged();
    }
    if (builders !== this.state.builders) {
      this.setState({
        builders: builders
      });
    }
    if (tokenXIcon !== this.state.tokenXIcon) {
      this.setState({
        tokenXIcon: tokenXIcon
      });
    }
    if (multivalueDelimiter !== this.state.multivalueDelimiter) {
      this.setState({
        multivalueDelimiter: multivalueDelimiter
      });
    }
    if (multivaluePasteDelimiter !== this.state.multivaluePasteDelimiter) {
      this.setState({
        multivaluePasteDelimiter: multivaluePasteDelimiter
      });
    }
    if (requestTransition !== this.state.requestTransition) {
      this.setState({
        requestTransition: requestTransition
      });
    }
    if (requestArchive !== this.state.requestArchive) {
      this.setState({
        requestArchive: requestArchive
      });
    }
    if (requestUnarchive !== this.state.requestUnarchive) {
      this.setState({
        requestUnarchive: requestUnarchive
      });
    }
    if (requestRemoveArchivedValue !== this.state.requestRemoveArchivedValue) {
      this.setState({
        requestRemoveArchivedValue: requestRemoveArchivedValue
      });
    }
    if (requestRewind !== this.state.requestRewind) {
      this.setState({
        requestRewind: requestRewind
      });
    }
    if (requestFocus !== this.state.requestFocus) {
      this.setState({
        requestFocus: requestFocus
      });
    }
    if (requestBlur !== this.state.requestBlur) {
      this.setState({
        requestBlur: requestBlur
      });
    }
    if (requestEdit !== this.state.requestEdit) {
      this.setState({
        requestEdit: requestEdit
      });
    }
    if (requestCancel !== this.state.requestCancel) {
      this.setState({
        requestCancel: requestCancel
      });
    }
    if (requestRemoval !== this.state.requestRemoval) {
      this.setState({
        requestRemoval: requestRemoval
      });
    }
    if (requestAddSuggestion !== this.state.requestAddSuggestion) {
      this.setState({
        requestAddSuggestion: requestAddSuggestion
      });
    }
    if (onEndToken !== this.state.onEndToken) {
      this.setState({
        onEndToken: onEndToken
      });
    }
    if (onValidityChanged !== this.state.onValidityChanged) {
      this.setState({
        onValidityChanged: onValidityChanged
      });
    }
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
    console.log(`unmounting ${this._id}`);
    this.cleanupListeners();
  }

  componentWillMount () {
    this.processProps(this.props);
  }

  componentDidMount () {
    this.connectListeners();
    console.log(`mounting ${this._id}`);
  }

  componentWillReceiveProps (nextProps) {
    this.processProps(nextProps);
  }

  @bind
  endToken (state, nextToken) {
    console.log(`end in ${this._id}`);
    this.state.onEndToken(this.value, nextToken);
  }

  @bind
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
    this.setState({focused: true});
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
    this.setState({focused: true});
  }

  @bind
  requestFocus () {
    this.focus();
    this.state.requestFocus();
  }

  @bind
  requestBlur () {
    this.setState({focused: false});
    this.state.requestBlur();
  }

  @bind
  requestRemoval (e) {
    e.preventDefault();
    e.stopPropagation();
    if (!this.state.machine.state.isValid) {
      this.state.onValidityChanged(true, this.state.machine.state.isValid);
    }
    this.state.requestRemoval(this.state.idx);
  }

  @bind
  requestAddSuggestion (e) {
    e.preventDefault();
    e.stopPropagation();
    this.state.requestAddSuggestion(this.state.idx);
  }

  @bind
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
      return <button className='token-action-add-suggestion' onClick={this.requestAddSuggestion}>ADD</button>;
    }
  }

  render (props, {active, flash, suggestion, machine, focused, multivalueDelimiter, multivaluePasteDelimiter}) {
    return (
      <div className={`token ${active ? 'active' : ''} ${suggestion ? 'suggestion' : ''} ${flash ? 'anim-flash' : ''} ${machine.isBindOnly ? 'bind-only' : ''}`} onMouseDown={this.requestEdit}>
        {this.icon}
        {this.state.stateArray.map(s => {
          const Builder = this.state.builders.getBuilder(s.template.constructor);
          return (<Builder
            machine={machine}
            machineState={s}
            requestTransition={this.state.requestTransition}
            requestArchive={this.state.requestArchive}
            requestUnarchive={this.state.requestUnarchive}
            requestRemoveArchivedValue={this.state.requestRemoveArchivedValue}
            requestRewind={this.state.requestRewind}
            requestFocus={this.requestFocus}
            requestBlur={this.requestBlur}
            requestCancel={this.state.requestCancel}
            validityChanged={this.state.onValidityChanged}
            readOnly={!active || s !== machine.state}
            blank={this.isBlank}
            focused={active && s === machine.state && focused}
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
