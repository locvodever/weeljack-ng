import { Component } from '@angular/core';
import { WjField } from 'weeljack-ng/field';
import { WjInputNumber } from 'weeljack-ng/inputnumber';

@Component({
  selector: 'docs-inputnumber-decimals-example',
  imports: [WjField, WjInputNumber],
  template: `
    <wj-field label="Rating" hint="From 0 to 5, in steps of 0.5.">
      <wj-inputnumber
        [min]="0"
        [max]="5"
        [step]="0.5"
        [minFractionDigits]="1"
        [maxFractionDigits]="1"
        [value]="4.5"
      />
    </wj-field>
  `,
  styles: `
    :host {
      display: grid;
      inline-size: min(100%, 24rem);
    }
  `,
})
export class InputNumberDecimalsExample {}
