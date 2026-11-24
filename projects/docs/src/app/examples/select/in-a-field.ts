import { Component } from '@angular/core';
import { WjField } from 'weeljack-ng/field';
import { WjSelect, type WjSelectOption } from 'weeljack-ng/select';

@Component({
  selector: 'docs-select-in-a-field-example',
  imports: [WjField, WjSelect],
  template: `
    <wj-field label="Country" hint="Where your order ships to.">
      <wj-select placeholder="Select a country" [options]="countries" />
    </wj-field>
    <wj-field label="Shipping method" error="Choose a shipping method.">
      <wj-select placeholder="Select a method" [options]="methods" />
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
export class SelectInAFieldExample {
  protected readonly countries: WjSelectOption<string>[] = [
    { label: 'Canada', value: 'ca' },
    { label: 'Germany', value: 'de' },
    { label: 'Japan', value: 'jp' },
    { label: 'Vietnam', value: 'vn' },
  ];
  protected readonly methods: WjSelectOption<string>[] = [
    { label: 'Standard (5 to 7 days)', value: 'standard' },
    { label: 'Express (1 to 2 days)', value: 'express' },
  ];
}
