import { Component } from '@angular/core';
import { WjField } from 'weeljack-ng/field';
import { WjInputNumber } from 'weeljack-ng/inputnumber';

@Component({
  selector: 'docs-inputnumber-currency-example',
  imports: [WjField, WjInputNumber],
  template: `
    <wj-field label="Price" hint="In Vietnamese dong.">
      <wj-inputnumber mode="currency" currency="VND" locale="vi-VN" [value]="125000" />
    </wj-field>
  `,
  styles: `
    :host {
      display: grid;
      inline-size: min(100%, 24rem);
    }
  `,
})
export class InputNumberCurrencyExample {}
