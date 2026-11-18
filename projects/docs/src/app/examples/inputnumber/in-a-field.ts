import { Component } from '@angular/core';
import { WjField } from 'weeljack-ng/field';
import { WjInputNumber } from 'weeljack-ng/inputnumber';

@Component({
  selector: 'docs-inputnumber-in-a-field-example',
  imports: [WjField, WjInputNumber],
  template: `
    <wj-field label="Quantity" hint="Between 1 and 99.">
      <wj-inputnumber [min]="1" [max]="99" [value]="1" />
    </wj-field>
    <wj-field label="Unit price" error="Enter a price above zero.">
      <wj-inputnumber [minFractionDigits]="2" [maxFractionDigits]="2" [value]="0" />
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
export class InputNumberInAFieldExample {}
