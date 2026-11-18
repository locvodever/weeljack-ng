import { Component } from '@angular/core';
import type { WjOption } from 'weeljack-ng';
import { WjField } from 'weeljack-ng/field';
import { WjMultiSelect } from 'weeljack-ng/multiselect';

@Component({
  selector: 'docs-multiselect-disabled-example',
  imports: [WjMultiSelect, WjField],
  template: `
    <wj-field label="Working days" hint="Managed by your administrator.">
      <wj-multiselect disabled [value]="['mon', 'wed']" [options]="days" />
    </wj-field>
    <wj-field label="Working days" hint="Sunday is shown, but cannot be picked.">
      <wj-multiselect placeholder="Select days" [options]="daysWithoutSunday" />
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
export class MultiSelectDisabledExample {
  protected readonly days: WjOption<string>[] = [
    { label: 'Monday', value: 'mon' },
    { label: 'Tuesday', value: 'tue' },
    { label: 'Wednesday', value: 'wed' },
    { label: 'Thursday', value: 'thu' },
    { label: 'Friday', value: 'fri' },
    { label: 'Saturday', value: 'sat' },
    { label: 'Sunday', value: 'sun' },
  ];
  /** `disabled` on an option shows the row greyed out, and it cannot be picked. */
  protected readonly daysWithoutSunday: WjOption<string>[] = this.days.map((day) =>
    day.value === 'sun' ? { ...day, disabled: true } : day,
  );
}
