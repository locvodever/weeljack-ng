import { DatePipe } from '@angular/common';
import { Component, signal } from '@angular/core';
import { WjDatePicker } from 'weeljack-ng/datepicker';
import { WjField } from 'weeljack-ng/field';

@Component({
  selector: 'docs-datepicker-basic-example',
  imports: [DatePipe, WjDatePicker, WjField],
  template: `
    <wj-field label="Start date">
      <wj-datepicker placeholder="mm/dd/yyyy" [(value)]="start" />
    </wj-field>
    <p class="state">Value: {{ (start() | date: 'mediumDate') ?? 'none' }}</p>
  `,
  styles: `
    :host {
      display: grid;
      gap: 16px;
      inline-size: min(100%, 24rem);
    }

    .state {
      margin: -8px 0 0;
      font-size: 0.875rem;
      color: var(--wj-text-muted-color);
    }
  `,
})
export class DatePickerBasicExample {
  protected readonly start = signal<Date | null>(null);
}
