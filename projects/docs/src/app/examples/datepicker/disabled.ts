import { Component } from '@angular/core';
import { WjDatePicker } from 'weeljack-ng/datepicker';
import { WjField } from 'weeljack-ng/field';

@Component({
  selector: 'docs-datepicker-disabled-example',
  imports: [WjDatePicker, WjField],
  template: `
    <wj-field label="Start date">
      <wj-datepicker showIcon disabled [value]="start" />
    </wj-field>
  `,
  styles: `
    :host {
      display: grid;
      inline-size: min(100%, 24rem);
    }
  `,
})
export class DatePickerDisabledExample {
  protected readonly start = new Date(2026, 10, 18);
}
