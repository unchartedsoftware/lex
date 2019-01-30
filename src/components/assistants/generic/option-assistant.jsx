import { h } from 'preact';
import { Bind } from 'lodash-decorators';
import { Assistant } from '../../assistant';
import { UP_ARROW, DOWN_ARROW, TAB, ENTER, normalizeKey } from '../../../lib/keys';

/**
 * A visual interaction mechanism for supplying values
 * to an `OptionState`. By default, this is registered as
 * the `Assistant` for `OptionState`s.
 *
 * @example
 * lex.registerAssistant(OptionState, OptionAssistant)
 */
export class OptionAssistant extends Assistant {
  constructor () {
    super();
    this.state.activeSuggestion = -1;
    this.state.suggestions = [];
  }

  cleanupListeners () {
    super.cleanupListeners();
    if (this.machineState) {
      this.machineState.removeListener('value unarchived', this.onValueUnarchived);
    }
  }

  connectListeners () {
    super.connectListeners();
    if (this.machineState) {
      this.machineState.on('value unarchived', this.onValueUnarchived);
    }
  }

  @Bind
  onValueUnarchived () {
    if (this.machineState) {
      setTimeout(() => this.machineState.refreshSuggestions('', this.machine.boxedValue));
    }
  }

  @Bind
  onSuggestionsChanged (newSuggestions) {
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
    this.machineState.unboxedValue = suggestion.key;
    if (this.machineState.isMultivalue) {
      const result = this.requestArchive();
      if (result) {
        this.machineState.unboxedValue = null;
        this.machineState.refreshSuggestions('', this.machine.boxedValue);
      }
    } else {
      this.requestTransition();
    }
  }

  @Bind
  onSuggestionHover (idx) {
    this.setState({
      activeSuggestion: idx
    });
    this.machineState.previewValue = this.state.suggestions[this.state.activeSuggestion];
    setTimeout(() => this.fixListScrollPosition());
  }

  @Bind
  onArchivedRemoved (idx) {
    this.requestRemoveArchivedValue(idx);
  }

  @Bind
  onRemoveArchivedValues (e) {
    if (e) {
      e.stopPropagation();
      e.preventDefault();
    }
    this.requestRemoveArchivedValues();
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
    if (oldMachineState) oldMachineState.removeListener('suggestions changed', this.onSuggestionsChanged);
    super.processProps(props);
    if (this.machineState !== oldMachineState) {
      this.setState({
        activeSuggestion: -1,
        suggestions: this.machineState.suggestions
      });
    }
    if (this.machineState) this.machineState.on('suggestions changed', this.onSuggestionsChanged);
  }

  delegateEvent (e) {
    let consumed = true;
    const normalizedKey = normalizeKey(e);
    switch (normalizedKey) {
      // Fallthrough case to handle IE
      case UP_ARROW:
        this.setState({activeSuggestion: Math.max(this.state.activeSuggestion - 1, 0)});
        this.machineState.previewValue = this.state.suggestions[this.state.activeSuggestion];
        setTimeout(() => this.fixListScrollPosition());
        break;
      // Fallthrough case to handle IE
      case DOWN_ARROW:
        this.setState({activeSuggestion: Math.min(this.state.activeSuggestion + 1, this.state.suggestions.length - 1)});
        this.machineState.previewValue = this.state.suggestions[this.state.activeSuggestion];
        setTimeout(() => this.fixListScrollPosition());
        break;
      case this.state.multivalueDelimiter:
        if (this.machineState.isMultivalue) {
          consumed = true;
          this.machineState.value = this.state.suggestions[this.state.activeSuggestion];
          this.requestArchive();
        }
        break;
      case ENTER:
      case TAB:
        const activeSuggestion = this.state.suggestions[this.state.activeSuggestion];
        if (activeSuggestion) {
          this.machineState.value = activeSuggestion;
          this.requestTransition({nextToken: normalizedKey === TAB});
        } else if (this.state.suggestions.length === 1 && !this.machineState.allowUnknown) {
          this.machineState.value = this.state.suggestions[0];
          this.requestTransition({nextToken: normalizedKey === TAB});
        }
        break;
      default:
        consumed = true;
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

  renderArchive () {
    if (this.machineState.isMultivalue) {
      const limitCounter = this.machineState.multivalueLimit !== undefined ? ` (${this.machineState.archive.length}/${this.machineState.multivalueLimit})` : '';
      const archive = this.machineState.archive;
      const keys = archive.map((o) => this.machineState.formatUnboxedValue(o.key, this.machine.boxedValue));
      let menu = '';
      if (archive.length > 0) {
        menu = (
          <div className='assistant-menu pull-right'>
            <span className='btn-group'>
              <button className='btn btn-xs btn-default' onClick={this.onCopyArchivedValues}>Copy All</button>
              <button className='btn btn-xs btn-default' onClick={this.onRemoveArchivedValues}>Clear All</button>
            </span>
          </div>
        );
      }

      return (
        <div className='assistant-right'>
          <div className='removable assistant-header'>
            <span>Entered Values{limitCounter}</span>
            {menu}
          </div>
          <ul>
            {
              keys.map((key, idx) => <li tabIndex='0' className='removable clearfix' onClick={() => this.onArchivedRemoved(idx)}><span className='pull-left'>{key}</span><em className='pull-right'>(click to remove)</em></li>)
            }
          </ul>
        </div>
      );
    }
  }

  renderAssistantBody (props, {activeSuggestion, suggestions}) {
    if (this.machineState.isMultivalue || (Array.isArray(this.machineState.suggestions) && this.machineState.suggestions.length > 0)) {
      return (
        <div className='assistant-body'>
          <div className={this.machineState.isMultivalue ? 'assistant-left' : ''}>
            { this.machineState.isMultivalue && <div className='assistant-header'>Suggestions</div>}
            <ul ref={(n) => { this.suggestionContainer = n; }}>
              {
                (!this.machineState.isMultivalue || this.machineState.canArchiveValue) && (suggestions.map((o, idx) => <li tabIndex='0' onClick={() => this.onSuggestionSelected(o)} onMouseOver={() => this.onSuggestionHover(idx)} className={idx === activeSuggestion ? 'selectable active' : 'selectable'}>{this.machineState.formatUnboxedValue(o.key, this.machine.boxedValue)}</li>))
              }
              { (!this.machineState.isMultivalue || this.machineState.canArchiveValue) && (!suggestions || suggestions.length === 0) && <li><em className='text-muted'>No suggestions</em></li>}
              { this.machineState.isMultivalue && !this.machineState.canArchiveValue && <li><em className='text-muted anim-flash'>Maximum number of values reached. <button className='btn btn-xs btn-default' onMouseDown={this.requestTransition}>{this.state.machine.state.isTerminal ? 'Finish' : 'Next'}?</button></em></li> }
            </ul>
          </div>
          {this.renderArchive(props)}
        </div>
      );
    }
  }
}
