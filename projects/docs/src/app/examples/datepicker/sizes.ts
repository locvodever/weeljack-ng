import { Component } from '@angular/core';
import { WjDatePicker } from 'weeljack-ng/datepicker';
import { WjField } from 'weeljack-ng/field';

@Component({
  selector: 'docs-datepicker-sizes-example',
  imports: [WjDatePicker, WjField],
  template: `
    <wj-field label="Small">
      <wj-datepicker showIcon size="small" placeholder="mm/dd/yyyy" />
    </wj-field>
    <wj-field label="Default">
      <wj-datepicker showIcon placeholder="mm/dd/yyyy" />
    </wj-field>
    <wj-field label="Large">
      <wj-datepicker showIcon size="large" placeholder="mm/dd/yyyy" />
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
export class DatePickerSizesExample {}
