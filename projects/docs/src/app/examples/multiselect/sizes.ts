import { Component } from '@angular/core';
import type { WjOption } from 'weeljack-ng';
import { WjField } from 'weeljack-ng/field';
import { WjMultiSelect } from 'weeljack-ng/multiselect';

@Component({
  selector: 'docs-multiselect-sizes-example',
  imports: [WjMultiSelect, WjField],
  template: `
    <wj-field label="Small">
      <wj-multiselect size="small" placeholder="Select days" [options]="days" />
    </wj-field>
    <wj-field label="Default">
      <wj-multiselect placeholder="Select days" [options]="days" />
    </wj-field>
    <wj-field label="Large">
      <wj-multiselect size="large" placeholder="Select days" [options]="days" />
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
export class MultiSelectSizesExample {
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
