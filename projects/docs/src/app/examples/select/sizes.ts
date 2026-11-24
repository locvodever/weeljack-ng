import { Component } from '@angular/core';
import { WjField } from 'weeljack-ng/field';
import { WjSelect, type WjSelectOption } from 'weeljack-ng/select';

@Component({
  selector: 'docs-select-sizes-example',
  imports: [WjField, WjSelect],
  template: `
    <wj-field label="Small">
      <wj-select size="small" placeholder="Pick a fruit" [options]="fruit" />
    </wj-field>
    <wj-field label="Default">
      <wj-select placeholder="Pick a fruit" [options]="fruit" />
    </wj-field>
    <wj-field label="Large">
      <wj-select size="large" placeholder="Pick a fruit" [options]="fruit" />
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
export class SelectSizesExample {
  protected readonly fruit: WjSelectOption<string>[] = [
    { label: 'Apple', value: 'apple' },
    { label: 'Banana', value: 'banana' },
  ];
}
