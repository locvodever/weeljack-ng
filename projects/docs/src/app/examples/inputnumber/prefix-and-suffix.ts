import { Component } from '@angular/core';
import { WjField } from 'weeljack-ng/field';
import { WjInputNumber } from 'weeljack-ng/inputnumber';

@Component({
  selector: 'docs-inputnumber-prefix-and-suffix-example',
  imports: [WjField, WjInputNumber],
  template: `
    <wj-field label="Weight">
      <wj-inputnumber suffix=" kg" [value]="70" />
    </wj-field>
    <wj-field label="Bonus points">
      <wj-inputnumber prefix="+" [value]="25" />
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
export class InputNumberPrefixAndSuffixExample {}
