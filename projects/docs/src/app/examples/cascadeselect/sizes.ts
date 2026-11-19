import { Component } from '@angular/core';
import { WjCascadeSelect, type WjCascadeSelectOption } from 'weeljack-ng/cascadeselect';
import { WjField } from 'weeljack-ng/field';

@Component({
  selector: 'docs-cascadeselect-sizes-example',
  imports: [WjCascadeSelect, WjField],
  template: `
    <wj-field label="Small">
      <wj-cascadeselect size="small" placeholder="Select a city" [options]="cities" />
    </wj-field>
    <wj-field label="Default">
      <wj-cascadeselect placeholder="Select a city" [options]="cities" />
    </wj-field>
    <wj-field label="Large">
      <wj-cascadeselect size="large" placeholder="Select a city" [options]="cities" />
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
export class CascadeSelectSizesExample {
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
            { label: 'Geelong', value: 'geelong' },
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
