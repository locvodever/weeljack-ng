import { Component } from '@angular/core';
import type { WjOption } from 'weeljack-ng';
import { WjField } from 'weeljack-ng/field';
import { WjMultiSelect } from 'weeljack-ng/multiselect';

@Component({
  selector: 'docs-multiselect-in-a-field-example',
  imports: [WjMultiSelect, WjField],
  template: `
    <wj-field label="Working days" hint="Pick every day you can work.">
      <wj-multiselect placeholder="Select days" [options]="days" />
    </wj-field>
    <wj-field label="Delivery days" error="Pick at least one day.">
      <wj-multiselect placeholder="Select days" [options]="days" />
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
export class MultiSelectInAFieldExample {
  protected readonly days: WjOption<string>[] = [
    { label: 'Monday', value: 'mon' },
    { label: 'Tuesday', value: 'tue' },
    { label: 'Wednesday', value: 'wed' },
    { label: 'Thursday', value: 'thu' },
    { label: 'Friday', value: 'fri' },
    { label: 'Saturday', value: 'sat' },
    { label: 'Sunday', value: 'sun' },
  ];
}
