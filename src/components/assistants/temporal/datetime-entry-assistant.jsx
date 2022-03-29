import { h } from 'preact';
import { Bind } from 'lodash-decorators';
import { Assistant } from '../../assistant';
import { ENTER, TAB, normalizeKey } from '../../../lib/keys';
import moment from 'moment-timezone';
import flatpickr from 'flatpickr';

// Timezone logic
// Dates coming from our state are in the desired timezone
// our date picker only supports the local timezone
// we must handle timezone changes when setting the date picker value
// and timezone changes when extracting the date picker value
function toLocalizedTz (date, format, timezone) {
  // get incoming date as a string using the desired timezone
  const stringDate = moment.tz(date, timezone).format(format);
  // reformat datestring into a date using local timezone
  return moment(stringDate, format).toDate();
}

function toDesiredTz (date, format, timezone) {
  // get incoming date as a string using the local timezone
  const stringDate = moment(date).format(format);
  // reformat datestring into a date using desired timezone
  return moment.tz(stringDate, format, timezone).toDate();
}

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
      value: undefined,
      isValid: true
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

  afterChangeMachineState () {
    super.afterChangeMachineState();
    if (this.machineState) {
      // if the machineState prop changes, but we don't re-render, we may need to change our value
      this.onValueChanged(this.machineState.value != null ? this.machineState.value : this.machineState.hilightedDate);
    }
  }

  get timezone () {
    return this.machineState.timezone;
  }

  get format () {
    return this.machineState.format;
  }

  get enableTime () {
    return this.machineState.enableTime;
  }

  get enableCalendar () {
    return this.machineState.enableCalendar;
  }

  get time24hr () {
    return this.machineState.time24hr;
  }

  get hilightedDate () {
    return this.machineState.hilightedDate;
  }

  get localizedMinMaxDates () {
    let minDate, maxDate;

    if (this.machineState.minDate && this.machineState.minDate instanceof Date) {
      minDate = toLocalizedTz(this.machineState.minDate, this.format, this.timezone);
    }

    if (this.machineState.maxDate && this.machineState.maxDate instanceof Date) {
      maxDate = toLocalizedTz(this.machineState.maxDate, this.format, this.timezone);
    }

    return {
      minDate, maxDate
    };
  }

  @Bind
  onValueChanged (newDate) {
    if (newDate) {
      // incoming date is in the desired timezone, but the date picker wants the local timezone.
      const localizedDate = toLocalizedTz(newDate, this.format, this.timezone);
      this.setState({
        value: newDate,
        isValid: true
      });
      if (this.dateInput && moment(localizedDate).isValid()) {
        this.dateInput.setDate(localizedDate);
      }
    } else {
      this.setState({
        value: null,
        isValid: false
      });
    }
  }

  componentWillUnmount () {
    if (super.componentWillUnmount) super.componentWillUnmount();
    if (this.dateInput) {
      this.dateInput.destroy();
      this.dateInput = undefined;
    }
  }

  componentDidMount () {
    if (super.componentDidMount) super.componentDidMount();
    if (!this.dateInput) {
      const localizedMinMaxDates = this.localizedMinMaxDates;
      let minDate = localizedMinMaxDates && localizedMinMaxDates.minDate ? moment(localizedMinMaxDates.minDate) : null;
      let maxDate = localizedMinMaxDates && localizedMinMaxDates.maxDate ? moment(localizedMinMaxDates.maxDate) : null;

      if (minDate && maxDate && minDate.isSameOrAfter(maxDate)) {
        console.warn(`minDate ${minDate.toDate()} is after maxDate ${maxDate.toDate()}, no date filtering will be applied`);
        minDate = null;
        maxDate = null;
      }

      let localizedSelectedDate;
      if (this.boxedValue && moment(this.boxedValue).isValid()) {
        // We have a selected date
        // The date picker wants dates in local TZ, since our date is in our desired TZ we need to convert
        localizedSelectedDate = toLocalizedTz(this.boxedValue, this.format, this.timezone);
      } else if (this.hilightedDate) {
        // We have no selected date, we should default to using the hilighted date
        // The date picker wants dates in local TZ, since hilighted date is in our desired TZ we need to convert
        localizedSelectedDate = toLocalizedTz(this.hilightedDate, this.format, this.timezone);
      }

      const selectedDateMoment = moment(localizedSelectedDate);

      if ((minDate && selectedDateMoment.isBefore(minDate)) || (maxDate && selectedDateMoment.isAfter(maxDate))) {
        console.warn(`Selected date ${localizedSelectedDate} is after maxDate ${maxDate.toDate()} or before minDate ${minDate.toDate()}, defaulting to minDate/maxDate`);
        localizedSelectedDate = (minDate || maxDate).toDate();
        this.boxedValue = toDesiredTz(localizedSelectedDate, this.format, this.timezone);
      }

      this.dateInput = flatpickr(this.dateInputEl, {
        inline: true,
        appendTo: this.dateContainerEl,
        dateFormat: this.format,
        minDate: minDate ? minDate.toDate() : null,
        maxDate: maxDate ? maxDate.toDate() : null,
        defaultDate: localizedSelectedDate,
        enableTime: this.enableTime,
        time_24hr: this.time24hr,
        noCalendar: !this.enableCalendar,
        formatDate: (date, format) => {
          // These dates are all internal to flatpickr, so they are always in local TZ
          return moment(date).format(format);
        },
        parseDate: (dateStr, format) => {
          // These dates are all internal to flatpickr, so they are always in local TZ
          return moment(dateStr, format).toDate();
        },
        onChange: (selectedDates, dateStr) => {
          // Our selectedDates are in the local timezone but we want to store the date in our desired timezone
          const date = moment((selectedDates && selectedDates[0]) || dateStr, this.format);
          const newDesiredTzDate = toDesiredTz(date.toDate(), this.format, this.timezone);
          const currentDesiredTzDate = this.boxedValue;
          if (currentDesiredTzDate === null || currentDesiredTzDate.toString() !== newDesiredTzDate.toString()) {
            this.boxedValue = newDesiredTzDate;
            if (this.boxedValue !== null && this.machineState.isMultivalue) this.requestArchive();
            this.requestFocus();
          }
        }
      });
    }
  }

  @Bind
  onArchivedRemoved (idx) {
    this.requestRemoveArchivedValue(idx);
  }

  delegateEvent (e) {
    let consumed = false;
    const normalizedKey = normalizeKey(e);
    switch (normalizedKey) {
      case ENTER:
      case TAB:
        // Use the currently "focused" date if we dont have a value and havent attempted to enter a value
        if (this.state.isValid && this.boxedValue == null && this.dateInput && this.dateInput.selectedDates && this.dateInput.selectedDates[0]) {
          // Our selectedDates are in the local timezone but we want to store the date in our desired timezone
          const newDesiredTzDate = toDesiredTz(this.dateInput.selectedDates[0], this.format, this.timezone);
          this.boxedValue = newDesiredTzDate;
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
          <input type='text' className='lex-dp-input' ref={(input) => { this.dateInputEl = input; }} />
          <div className='lex-dp-container' ref={(input) => { this.dateContainerEl = input; }} />
        </div>
        {this.renderArchive(props)}
      </div>
    );
  }
}
