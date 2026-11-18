import { Component } from '@angular/core';
import { WjCascadeSelect, type WjCascadeSelectOption } from 'weeljack-ng/cascadeselect';
import { WjField } from 'weeljack-ng/field';

@Component({
  selector: 'docs-cascadeselect-disabled-example',
  imports: [WjCascadeSelect, WjField],
  template: `
    <wj-field label="City" hint="Managed by your administrator.">
      <wj-cascadeselect disabled value="melbourne" [options]="cities" />
    </wj-field>
    <wj-field label="City" hint="Geelong is shown, but cannot be picked.">
      <wj-cascadeselect placeholder="Select a city" [options]="cities" />
    </wj-field>
  `,
  styles: `
    :host {
      display: grid;
      gap: 16px;
      inline-size: min(100%, 16rem);
    }
  `,
})
export class CascadeSelectDisabledExample {
  /** `disabled` on a leaf or a group shows the row greyed out at any level, and it cannot be chosen. */
  protected readonly cities: WjCascadeSelectOption<string>[] = [
    {
      label: 'Australia',
      children: [
        {
          label: 'New South Wales',
          children: [
            { label: 'Sydney', value: 'sydney' },
            { label: 'Newcastle', value: 'newcastle' },
          ],
        },
        {
          label: 'Victoria',
          children: [
            { label: 'Melbourne', value: 'melbourne' },
            { label: 'Geelong', value: 'geelong', disabled: true },
          ],
        },
      ],
    },
    {
      label: 'Canada',
      children: [
        {
          label: 'Ontario',
          children: [
            { label: 'Toronto', value: 'toronto' },
            { label: 'Ottawa', value: 'ottawa' },
          ],
        },
        {
          label: 'Quebec',
          children: [
            { label: 'Montreal', value: 'montreal' },
            { label: 'Quebec City', value: 'quebec-city' },
          ],
        },
      ],
    },
    {
      label: 'United States',
      children: [
        {
          label: 'California',
          children: [
            { label: 'Los Angeles', value: 'los-angeles' },
            { label: 'San Francisco', value: 'san-francisco' },
          ],
        },
        {
          label: 'Texas',
          children: [
            { label: 'Austin', value: 'austin' },
            { label: 'Houston', value: 'houston' },
          ],
        },
      ],
    },
  ];
}
