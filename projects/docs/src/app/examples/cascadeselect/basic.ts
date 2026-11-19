import { Component, signal } from '@angular/core';
import { WjCascadeSelect, type WjCascadeSelectOption } from 'weeljack-ng/cascadeselect';

@Component({
  selector: 'docs-cascadeselect-basic-example',
  imports: [WjCascadeSelect],
  template: `
    <label for="basic-city">City</label>
    <wj-cascadeselect
      inputId="basic-city"
      placeholder="Select a city"
      [options]="cities"
      [(value)]="city"
    />
    <p class="state">Value: {{ city() ?? 'none' }}</p>
  `,
  styles: `
    :host {
      display: flex;
      flex-wrap: wrap;
      align-items: center;
      gap: 8px;
    }

    wj-cascadeselect {
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
export class CascadeSelectBasicExample {
  /** Leaves carry no `children` key: that is what makes a row a group. */
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
  protected readonly city = signal<string | null>(null);
}
