import { Component } from '@angular/core';
import { WjField } from 'weeljack-ng/field';
import { WjInputNumber } from 'weeljack-ng/inputnumber';

@Component({
  selector: 'docs-inputnumber-sizes-example',
  imports: [WjField, WjInputNumber],
  template: `
    <wj-field label="Small">
      <wj-inputnumber showButtons size="small" [value]="1" />
    </wj-field>
    <wj-field label="Default">
      <wj-inputnumber showButtons [value]="1" />
    </wj-field>
    <wj-field label="Large">
      <wj-inputnumber showButtons size="large" [value]="1" />
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
export class InputNumberSizesExample {}
