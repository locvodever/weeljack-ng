import { Component } from '@angular/core';
import { WjDatePicker } from 'weeljack-ng/datepicker';
import { WjField } from 'weeljack-ng/field';

@Component({
  selector: 'docs-datepicker-with-the-calendar-button-example',
  imports: [WjDatePicker, WjField],
  template: `
    <wj-field label="Due date">
      <wj-datepicker showIcon placeholder="mm/dd/yyyy" />
    </wj-field>
  `,
  styles: `
    :host {
      display: grid;
      inline-size: min(100%, 24rem);
    }
  `,
})
export class DatePickerWithTheCalendarButtonExample {}
