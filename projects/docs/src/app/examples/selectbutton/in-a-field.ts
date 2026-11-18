import { Component } from '@angular/core';
import type { WjOption } from 'weeljack-ng';
import { WjField } from 'weeljack-ng/field';
import { WjSelectButton } from 'weeljack-ng/selectbutton';

@Component({
  selector: 'docs-selectbutton-in-a-field-example',
  imports: [WjField, WjSelectButton],
  template: `
    <wj-field label="Billing period" hint="Yearly saves two months.">
      <wj-selectbutton [options]="periods" />
    </wj-field>
    <wj-field label="Text size" error="Choose a text size.">
      <wj-selectbutton [options]="sizes" />
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
export class SelectButtonInAFieldExample {
  protected readonly periods: WjOption<string>[] = [
    { label: 'Monthly', value: 'monthly' },
    { label: 'Yearly', value: 'yearly' },
  ];
  protected readonly sizes: WjOption<string>[] = [
    { label: 'Small', value: 'small' },
    { label: 'Medium', value: 'medium' },
    { label: 'Large', value: 'large' },
  ];
}
