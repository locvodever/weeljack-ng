import { Component } from '@angular/core';
import type { WjOption } from 'weeljack-ng';
import { WjField } from 'weeljack-ng/field';
import { WjListbox } from 'weeljack-ng/listbox';

@Component({
  selector: 'docs-listbox-disabled-example',
  imports: [WjField, WjListbox],
  template: `
    <wj-field label="Email notifications" hint="Managed by your administrator.">
      <wj-listbox disabled value="daily" [options]="frequencies" />
    </wj-field>
    <wj-field label="Digest" hint="Instantly is shown but cannot be picked.">
      <wj-listbox [options]="digests" />
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
export class ListboxDisabledExample {
  protected readonly frequencies: WjOption<string>[] = [
    { label: 'Instantly', value: 'instantly' },
    { label: 'Every hour', value: 'hourly' },
    { label: 'Once a day', value: 'daily' },
    { label: 'Once a week', value: 'weekly' },
    { label: 'Never', value: 'never' },
  ];
  protected readonly digests: WjOption<string>[] = [
    { label: 'Instantly', value: 'instantly', disabled: true },
    { label: 'Every hour', value: 'hourly' },
    { label: 'Once a day', value: 'daily' },
    { label: 'Once a week', value: 'weekly' },
    { label: 'Never', value: 'never' },
  ];
}
