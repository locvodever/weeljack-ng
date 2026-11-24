import { Component } from '@angular/core';
import { WjDatePicker } from 'weeljack-ng/datepicker';
import { WjField } from 'weeljack-ng/field';

@Component({
  selector: 'docs-datepicker-in-a-field-example',
  imports: [WjDatePicker, WjField],
  template: `
    <wj-field label="Check-in" hint="The day you arrive.">
      <wj-datepicker showIcon placeholder="mm/dd/yyyy" />
    </wj-field>
    <wj-field label="Check-out" error="Choose a date after check-in.">
      <wj-datepicker showIcon placeholder="mm/dd/yyyy" />
    </wj-field>
  `,
  styles: `
    :host {
      display: grid;
      gap: 16px;
      inline-size: min(100%, 24rem);
    }
  `,
})
export class DatePickerInAFieldExample {}
