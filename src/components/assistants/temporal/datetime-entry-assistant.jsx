import { h } from 'preact';
import { bind } from 'decko';
import { Assistant } from '../../assistant';
import TinyDatePicker from 'tiny-date-picker';

/**
 * A visual interaction mechanism for supplying values
 * to an `DateTimeEntryState`. By default, this is registered as
 * the `Assistant` for `DatetimeEntryState`s.
 *
 * @example
 * lex.registerAssistant(DateTimeEntryState, DateTimeEntryAssistant)
 */
export class DateTimeEntryAssistant extends Assistant {
  constructor () {
    super();
    this.state = {
      value: undefined
    };
  }

  cleanupListeners () {
    super.cleanupListeners();
    if (this.machineState) {
      this.machineState.removeListener('value changed', this.onValueChanged);
    }
  }

  connectListeners () {
    super.connectListeners();
    if (this.machineState) {
      this.machineState.on('value changed', this.onValueChanged);
    }
  }

  @bind
  onValueChanged (newDate) {
    if (newDate) {
      this.setState({
        value: newDate
      });
      if (this.dateInput) {
        this.dateInput.setState({
          selectedDate: newDate,
          highlightedDate: newDate
        });
      }
    } else if (this.dateInput) {
      this.dateInput.setState({
        selectedDate: null,
        highlightedDate: new Date()
      });
    }
  }

  componentWillUnmount () {
    if (super.componentWillUnmount) super.componentWillUnmount();
    if (this.dateContainer && this.dateInput) {
      this.dateInput.off();
      this.dateInput.destroy();
      this.dateInput = undefined;
    }
  }

  componentDidMount () {
    if (super.componentDidMount) super.componentDidMount();
    if (!this.dateInput) {
      try {
        this.dateInput = TinyDatePicker(this.dateContainer, {
          mode: 'dp-permanent'
        });
      } catch (err) {
        // ignore irritating HTML error from date picker for now
      } finally {
        this.dateInput.on('statechange', (_, picker) => {
          if (this.boxedValue === null || picker.state.selectedDate.getTime() !== this.boxedValue.getTime()) {
            this.boxedValue = picker.state.selectedDate;
            if (this.boxedValue !== null && this.machineState.isMultivalue) this.requestArchive();
            this.requestFocus();
          }
        });
      }
    }
  }

  @bind
  onArchivedRemoved (idx) {
    this.requestRemoveArchivedValue(idx);
  }

  renderArchive () {
    if (this.machineState.isMultivalue) {
      return (
        <div className='assistant-right'>
          <div className='assistant-header'>Entered Values</div>
          <ul>
            {
              this.machineState.archive.map((v, idx) => <li tabIndex='0' className='removable' onClick={() => this.onArchivedRemoved(idx)}>{this.machineState.unboxValue(v)}<em className='pull-right'>(click to remove)</em></li>)
            }
          </ul>
        </div>
      );
    }
  }

  renderInteractive (props) {
    return (
      <div className='assistant'>
        <div className='assistant-header'>
          {this.machineState.name}
          <span className='pull-right'>
            {this.machineState.isMultivalue && <span><strong>{this.state.multivalueDelimiter}</strong> to enter multiple values&nbsp;&nbsp;&nbsp;</span>}
            <strong>Tab</strong> to {this.machineState.isMultivalue ? 'progress' : 'select'}
          </span>
        </div>
        <div className='assistant-body'>
          <div className={this.machineState.isMultivalue ? 'assistant-left' : ''}>
            { this.machineState.isMultivalue && <div className='assistant-header'>Calendar</div>}
            <div className='lex-dp-container' ref={(input) => { this.dateContainer = input; }} />
          </div>
          {this.renderArchive(props)}
        </div>
      </div>
    );
  }
}
