import { Component, signal } from '@angular/core';
import type { WjOption } from 'weeljack-ng';
import { WjMultiSelect } from 'weeljack-ng/multiselect';

@Component({
  selector: 'docs-multiselect-basic-example',
  imports: [WjMultiSelect],
  template: `
    <label for="basic-days">Working days</label>
    <wj-multiselect
      inputId="basic-days"
      placeholder="Select days"
      [options]="days"
      [(value)]="selected"
    />
    <p class="state">Value: {{ selected().length ? selected().join(', ') : 'none' }}</p>
  `,
  styles: `
    :host {
      display: flex;
      flex-wrap: wrap;
      align-items: center;
      gap: 8px;
    }

    wj-multiselect {
      inline-size: 16rem;
    }

    .state {
      flex-basis: 100%;
      margin: 0;
      font-size: 0.875rem;
      color: var(--wj-text-muted-color);
    }
  `,
})
export class MultiSelectBasicExample {
  protected readonly days: WjOption<string>[] = [
    { label: 'Monday', value: 'mon' },
    { label: 'Tuesday', value: 'tue' },
    { label: 'Wednesday', value: 'wed' },
    { label: 'Thursday', value: 'thu' },
    { label: 'Friday', value: 'fri' },
    { label: 'Saturday', value: 'sat' },
    { label: 'Sunday', value: 'sun' },
  ];
  /** The picked values, in the order they were picked. */
  protected readonly selected = signal<string[]>([]);
}
