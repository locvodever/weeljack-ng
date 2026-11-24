import { DatePipe } from '@angular/common';
import { Component, signal } from '@angular/core';
import { WjDatePicker } from 'weeljack-ng/datepicker';
import { WjField } from 'weeljack-ng/field';

@Component({
  selector: 'docs-datepicker-inline-example',
  imports: [DatePipe, WjDatePicker, WjField],
  template: `
    <wj-field label="Delivery date">
      <wj-datepicker inline [(value)]="delivery" />
    </wj-field>
    <p class="state">Delivery: {{ (delivery() | date: 'mediumDate') ?? 'none' }}</p>
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
export class DatePickerInlineExample {
  /** A fixed date, so the picked day looks the same on every build. */
  protected readonly delivery = signal<Date | null>(new Date(2026, 10, 18));
}
