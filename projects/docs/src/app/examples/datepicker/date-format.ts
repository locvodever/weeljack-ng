import { Component } from '@angular/core';
import { WjDatePicker } from 'weeljack-ng/datepicker';
import { WjField } from 'weeljack-ng/field';

@Component({
  selector: 'docs-datepicker-date-format-example',
  imports: [WjDatePicker, WjField],
  template: `
    <wj-field label="Date of birth" hint="Day, month, year.">
      <wj-datepicker dateFormat="dd/mm/yy" placeholder="dd/mm/yyyy" />
    </wj-field>
  `,
  styles: `
    :host {
      display: grid;
      inline-size: min(100%, 24rem);
    }
  `,
})
export class DatePickerDateFormatExample {}
