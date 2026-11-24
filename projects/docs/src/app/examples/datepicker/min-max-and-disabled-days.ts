import { Component } from '@angular/core';
import { WjDatePicker } from 'weeljack-ng/datepicker';
import { WjField } from 'weeljack-ng/field';

@Component({
  selector: 'docs-datepicker-min-max-and-disabled-days-example',
  imports: [WjDatePicker, WjField],
  template: `
    <wj-field label="Appointment date" hint="A weekday in the next 30 days.">
      <wj-datepicker
        showIcon
        placeholder="mm/dd/yyyy"
        [minDate]="today"
        [maxDate]="inThirtyDays"
        [disabledDays]="weekend"
      />
    </wj-field>
  `,
  styles: `
    :host {
      display: grid;
      inline-size: min(100%, 24rem);
    }
  `,
})
export class DatePickerMinMaxAndDisabledDaysExample {
  protected readonly today = new Date();
  protected readonly inThirtyDays = new Date(
    this.today.getFullYear(),
    this.today.getMonth(),
    this.today.getDate() + 30,
  );
  /** Sunday and Saturday: 0 is Sunday. */
  protected readonly weekend = [0, 6];
}
