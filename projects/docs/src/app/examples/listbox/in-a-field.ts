import { Component } from '@angular/core';
import type { WjOption } from 'weeljack-ng';
import { WjField } from 'weeljack-ng/field';
import { WjListbox } from 'weeljack-ng/listbox';

@Component({
  selector: 'docs-listbox-in-a-field-example',
  imports: [WjField, WjListbox],
  template: `
    <wj-field label="Delivery slot" hint="We text you 30 minutes before.">
      <wj-listbox [options]="slots" />
    </wj-field>
    <wj-field label="Pickup point" error="Choose a pickup point.">
      <wj-listbox [options]="points" />
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
export class ListboxInAFieldExample {
  protected readonly slots: WjOption<string>[] = [
    { label: 'Morning', value: 'morning' },
    { label: 'Afternoon', value: 'afternoon' },
    { label: 'Evening', value: 'evening' },
  ];
  protected readonly points: WjOption<string>[] = [
    { label: 'Front desk', value: 'front-desk' },
    { label: 'Locker', value: 'locker' },
    { label: 'Loading bay', value: 'loading-bay' },
  ];
}
