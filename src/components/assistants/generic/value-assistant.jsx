import { h } from 'preact';
import { Bind } from 'lodash-decorators';
import { Assistant } from '../../assistant';
import { UP_ARROW, DOWN_ARROW, TAB, ENTER, normalizeKey } from '../../../lib/keys';

/**
 * A visual interaction mechanism for supplying values
 * to a `ValueState`. By default, this is registered as
 * the `Assistant` for `ValueState`s.
 *
 * @example
 * lex.registerAssistant(ValueState, ValueAssistant)
 */
export class ValueAssistant extends Assistant {
  constructor () {
    super();
    this.state.activeSuggestion = -1;
    this.state.archiveValueEditIndex = -1;
    this.state.suggestions = [];
  }

  cleanupListeners () {
    super.cleanupListeners();
    if (this.machineState) {
      // this.machineState.removeListener('value unarchived', this.onValueUnarchived);
      this.machineState.removeListener('fetching suggestions', this.onFetchingSuggestions);
      this.machineState.removeListener('fetching suggestions finished', this.onFetchSuggestionsEnd);
      this.machineState.removeListener('suggestions changed', this.onSuggestionsChanged);
      this.machineState.removeListener('typed text changed', this.onTypedTextChanged);
    }
  }

  connectListeners () {
    super.connectListeners();
    if (this.machineState) {
      // this.machineState.on('value unarchived', this.onValueUnarchived);
      this.machineState.on('fetching suggestions', this.onFetchingSuggestions);
      this.machineState.on('fetching suggestions finished', this.onFetchSuggestionsEnd);
      this.machineState.on('suggestions changed', this.onSuggestionsChanged);
      this.machineState.on('typed text changed', this.onTypedTextChanged);
    }
  }

  fetchSuggestions (hint, formattedHint) {
    if (this.machineState) {
      this.machineState.fetchSuggestions(hint, this.machine.value, formattedHint);
    }
  }

  @Bind
  onTypedTextChanged (newText) {
    this.setState({
      activeSuggestion: -1,
      typedText: newText
    });
    if (this.machineState) {
      this.machineState.previewValue = null;
    }
  }

  @Bind
  onFetchingSuggestions () {
    this.loading = true;
  }

  @Bind
  onFetchSuggestionsEnd () {
    this.loading = false;
  }

  @Bind
  onSuggestionsChanged (newSuggestions) {
    this.loading = false;
    let activeSuggestion = newSuggestions.length === 1 ? 0 : -1;
    for (let i = 0; i < newSuggestions.length; i++) {
      if (newSuggestions[i].highlighted) {
        activeSuggestion = i;
        break;
      }
    }
    this.setState({
      activeSuggestion: activeSuggestion,
      suggestions: newSuggestions
    });
  }

  @Bind
  onSuggestionSelected (suggestion) {
    this.machineState.boxedValue = suggestion;
    if (this.machineState.isMultivalue) {
      const result = this.requestArchive();
      if (result) {
        this.machineState.boxedValue = null;
        this.machineState.fetchSuggestions('', this.machine.boxedValue, '');
      }
    } else {
      this.requestTransition();
    }
  }

  @Bind
  onSuggestionOver (idx) {
    this.setState({
      activeSuggestion: idx
    });
    this.machineState.previewValue = this.state.suggestions[this.state.activeSuggestion];
  }

  @Bind
  onSuggestionOut () {
    this.setState({
      activeSuggestion: -1
    });
    this.machineState.previewValue = null;
  }

  @Bind
  onArchivedRemoved (idx) {
    this.requestRemoveArchivedValue(idx);
    setTimeout(() => this.machineState.fetchSuggestions('', this.machine.value, ''), 10);
  }

  @Bind
  onRemoveArchivedValue (e, idx) {
    if (e) {
      e.stopPropagation();
      e.preventDefault();
    }
    this.requestRemoveArchivedValue(idx);
    setTimeout(() => this.machineState.fetchSuggestions('', this.machine.value, ''), 10);
  }

  @Bind
  onRemoveArchivedValues (e) {
    if (e) {
      e.stopPropagation();
      e.preventDefault();
    }
    this.requestRemoveArchivedValues();
    setTimeout(() => this.machineState.fetchSuggestions('', this.machine.value, ''), 10);
  }

  @Bind
  requestEditArchivedValue (e, idx) {
    if (e) {
      e.stopPropagation();
      e.preventDefault();
    }
    if (!this.machineState.allowUnknown) return; // can't edit when allowUnknown is false
    this.setState({
      archiveValueEditIndex: idx
    });
    setTimeout(() => {
      if (this._editArchivedValueRef) {
        this._editArchivedValueRef.focus();
      }
    }, 10);
  }

  @Bind
  cancelEditArchivedValue (e) {
    return this.requestEditArchivedValue(e, -1);
  }

  @Bind
  onUpdateArchivedValue (e) {
    if (e) {
      e.stopPropagation();
      e.preventDefault();
    }
    if (!this._editArchivedValueRef) return;
    const unformatted = this.machineState.unformatUnboxedValue(this._editArchivedValueRef.value, this.machine.boxedValue);
    const newBoxedValue = this.machineState.boxValue(unformatted);
    const success = this.requestUpdateArchivedValue(this.state.archiveValueEditIndex, newBoxedValue);
    if (success) {
      this.cancelEditArchivedValue();
    }
  }

  @Bind
  onCopyArchivedValues (e) {
    if (e) {
      e.stopPropagation();
      e.preventDefault();
    }
    if (this.machineState) {
      // via https://hackernoon.com/copying-text-to-clipboard-with-javascript-df4d4988697f
      const el = document.createElement('textarea');
      el.value = this.machineState.archive.map((o) => this.machineState.formatUnboxedValue(o.key, this.machine.boxedValue)).join(this.state.multivaluePasteDelimiter);
      el.setAttribute('readonly', '');
      el.style.position = 'absolute';
      el.style.left = '-9999px';
      document.body.appendChild(el);
      const selected =
        document.getSelection().rangeCount > 0
          ? document.getSelection().getRangeAt(0)
          : false;
      el.select();
      document.execCommand('copy');
      document.body.removeChild(el);
      if (selected) {
        document.getSelection().removeAllRanges();
        document.getSelection().addRange(selected);
      }
    }
  }

  processProps (props) {
    const oldMachineState = this.machineState;
    super.processProps(props);
    if (this.machineState !== oldMachineState) {
      this.setState({
        activeSuggestion: -1,
        suggestions: this.machineState.suggestions
      });
    }
  }

  /*
   * @private
   */
  get xicon () {
    return <span dangerouslySetInnerHTML={{__html: this.state.tokenXIcon}} />;
  }

  delegateEvent (e) {
    let consumed = false;
    const normalizedKey = normalizeKey(e);
    switch (normalizedKey) {
      // Fallthrough case to handle IE
      case UP_ARROW:
        if (this.focused) {
          this.setState({activeSuggestion: Math.max(this.state.activeSuggestion - 1, 0)});
          this.machineState.previewValue = this.state.suggestions[this.state.activeSuggestion];
          consumed = true;
          setTimeout(() => this.fixListScrollPosition());
        }
        break;
      // Fallthrough case to handle IE
      case DOWN_ARROW:
        if (this.focused) {
          this.setState({activeSuggestion: Math.min(this.state.activeSuggestion + 1, this.state.suggestions.length - 1)});
          this.machineState.previewValue = this.state.suggestions[this.state.activeSuggestion];
          consumed = true;
          setTimeout(() => this.fixListScrollPosition());
        }
        break;
      case ENTER:
      case TAB:
        const activeSuggestion = this.state.suggestions[this.state.activeSuggestion];
        if (activeSuggestion) {
          this.machineState.value = activeSuggestion;
          if (this.machineState.canArchiveValue) {
            this.requestArchive();
          } else {
            this.requestTransition({nextToken: normalizedKey === TAB}); // only consume the event if the transition succeeds
          }
          consumed = true;
        } else if (this.state.suggestions.length === 1 && !this.machineState.allowUnknown) {
          this.machineState.value = this.state.suggestions[0];
          if (this.machineState.canArchiveValue) {
            this.requestArchive();
          } else {
            this.requestTransition({nextToken: normalizedKey === TAB}); // only consume the event if the transition succeeds
          }
          consumed = true;
        }
        break;
    }
    if (consumed) {
      e.stopPropagation();
      e.preventDefault();
    }
    return consumed;
  }

  fixListScrollPosition () {
    if (this.suggestionContainer) {
      const activeNode = this.suggestionContainer.querySelector('li.active');
      if (activeNode && activeNode.offsetTop > this.suggestionContainer.offsetTop + this.suggestionContainer.offsetHeight - 10) {
        this.suggestionContainer.scrollTop = activeNode.offsetTop - this.suggestionContainer.offsetTop;
      } else if (activeNode && activeNode.offsetTop + activeNode.offsetHeight < this.suggestionContainer.scrollTop + 10) {
        this.suggestionContainer.scrollTop = activeNode.offsetTop - this.suggestionContainer.offsetTop;
      }
    }
  }

  @Bind
  captureEditArchivedValueInputRef (ref) {
    this._editArchivedValueRef = ref;
  }

  renderArchive () {
    if (this.machineState.isMultivalue) {
      // const limitCounter = this.machineState.multivalueLimit !== undefined ? ` (${this.machineState.archive.length}/${this.machineState.multivalueLimit})` : '';
      const archive = this.machineState.archive;
      const keys = archive.map((o) => this.machineState.formatUnboxedValue(o.key, this.machine.boxedValue));
      let menu = '';
      let list = '';
      if (archive.length > 0) {
        menu = (
          <div className='assistant-content-menu text-right'>
            <span className='btn-group'>
              <button className='btn btn-sm btn-default' onClick={this.onCopyArchivedValues}>Copy All</button>
              <button className='btn btn-sm btn-default' onClick={this.onRemoveArchivedValues}>Clear All</button>
            </span>
          </div>
        );
        list = (
          <ul className='entered-values'>
            {
              keys.map((key, idx) => {
                if (idx === this.state.archiveValueEditIndex) {
                  return (
                    <li tabIndex='0' key={key} id={`lex-multivalue-${idx}`} className='entered-value active'>
                      <input type='text' className={`token-input active ${this.state.valid ? '' : 'invalid'}`} autoFocus onBlur={this.cancelEditArchivedValue} value={key} ref={this.captureEditArchivedValueInputRef} />
                      <span className='btn-group'>
                        <button type='button' onMouseDown={this.onUpdateArchivedValue} className='btn btn-xs btn-primary token-next' aria-label='Save'>Save</button>
                        <button type='button' onMouseDown={this.cancelEditArchivedValue} className='btn btn-xs btn-default token-next' aria-label='Cancel'>Cancel</button>
                      </span>
                    </li>
                  );
                } else {
                  return (
                    <li tabIndex='0' key={key} id={`lex-multivalue-${idx}`} className='entered-value'>
                      <span onClick={(e) => this.requestEditArchivedValue(e, idx)}>{key}</span>
                      <button type='button' onMouseDown={(e) => this.onRemoveArchivedValue(e, idx)} className='btn btn-xs btn-link token-remove' aria-label='Close'>
                        {this.xicon}
                      </button>
                    </li>
                  );
                }
              })
            }
          </ul>
        );
      }

      return (
        <div className='multivalue-list'>
          {list}
          {menu}
        </div>
      );
    }
  }

  renderAssistantBody (props, {typedText, loading, activeSuggestion, suggestions}) {
    let prompt = '';
    if (!this.machineState.suggestionsDisabled && typedText && typedText.length > 0 && !loading) {
      prompt = `No suggestions for "${typedText}"`;
    }
    return (
      <div className='assistant-body'>
        {this.renderArchive(props)}
        <div className=''>
          { this.machineState.isMultivalue && this.machineState.archive.length > 0 && <div className='assistant-header'>Suggestions</div>}
          <ul ref={(n) => { this.suggestionContainer = n; }}>
            {
              (!this.machineState.isMultivalue || this.machineState.canArchiveValue) && (suggestions.map((o, idx) => <li key={o.key} tabIndex='0' onClick={() => this.onSuggestionSelected(o)} onMouseOver={() => this.onSuggestionOver(idx)} onMouseOut={this.onSuggestionOut} className={idx === activeSuggestion ? 'selectable active' : 'selectable'}>{this.machineState.formatUnboxedValue(o.key, this.machine.boxedValue)}</li>))
            }
            { (!this.machineState.isMultivalue || this.machineState.canArchiveValue) && (!suggestions || suggestions.length === 0) && (prompt.length > 0) && <li><em className='text-muted'>{prompt}</em></li>}
            { this.machineState.isMultivalue && !this.machineState.canArchiveValue && <li><em className='text-muted anim-flash'>Maximum number of values reached. <button className={`btn btn-xs ${this.state.machine.state.isTerminal ? 'btn-primary' : 'btn-default'}`} onMouseDown={this.requestTransition}>{this.state.machine.state.isTerminal ? 'Finish' : 'Next'}?</button></em></li> }
          </ul>
        </div>
      </div>
    );
  }
}
