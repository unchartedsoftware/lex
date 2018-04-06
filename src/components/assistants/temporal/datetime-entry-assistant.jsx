import { h } from 'preact';
import { bind } from 'decko';
import { Assistant } from '../../assistant';
import TinyDatePicker from 'tiny-date-picker';
import { ENTER, TAB, normalizeKey } from '../../../lib/keys';
import moment from 'moment';
import 'moment-timezone';

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
      // incoming date is in the target timezone, but TinyDatePicker wants the local timezone.
      const stringDate = moment.tz(newDate, this.machineState.template.timezone).format('YYYY-MM-DD'); // get incoming date as a string
      const localizedDate = moment(stringDate, 'YYYY-MM-DD').toDate();
      this.setState({
        value: localizedDate
      });
      if (this.dateInput) {
        this.dateInput.setState({
          selectedDate: localizedDate,
          hilightedDate: localizedDate
        });
      }
    } else if (this.dateInput) {
      // TODO clear selected date. This doesn't work right now because it sets the selection to "today", emitting a change event which overwrites what the user has typed
      // this.dateInput.setState({
      //   selectedDate: undefined,
      //   hilightedDate: undefined
      // });
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
          const stringDate = moment(picker.state.selectedDate).format('YYYY-MM-DD'); // get selected date as a string
          const stringBoxedValue = this.boxedValue === null ? null : moment.tz(this.boxedValue, this.machineState.template.timezone).format('YYYY-MM-DD');
          if (stringDate !== stringBoxedValue) {
            this.boxedValue = moment.tz(stringDate, 'YYYY-MM-DD', this.machineState.template.timezone).toDate(); // reinterpret as being in target timezone
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

  delegateEvent (e) {
    let consumed = false;
    const normalizedKey = normalizeKey(e);
    switch (normalizedKey) {
      case ENTER:
      case TAB:
        // Use the currently "focused" date if we dont have a value
        if (this.boxedValue == null && this.dateInput && this.dateInput.state.hilightedDate) {
          const stringDate = moment(this.dateInput.state.hilightedDate).format('YYYY-MM-DD'); // get selected date as a string
          this.boxedValue = moment.tz(stringDate, 'YYYY-MM-DD', this.machineState.template.timezone).toDate(); // reinterpret as being in target timezone
        }

        this.requestTransition({nextToken: normalizedKey === TAB});

        consumed = true;
        break;
    }
    if (consumed) {
      e.stopPropagation();
      e.preventDefault();
    }
    return consumed;
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

  renderAssistantBody (props) {
    return (
      <div className='assistant-body'>
        <div className={this.machineState.isMultivalue ? 'assistant-left' : ''}>
          { this.machineState.isMultivalue && <div className='assistant-header'>Calendar</div>}
          <div className='lex-dp-container' ref={(input) => { this.dateContainer = input; }} />
        </div>
        {this.renderArchive(props)}
      </div>
    );
  }
}
