import { Component } from '@angular/core';
import { WjField } from 'weeljack-ng/field';
import { WjInputNumber } from 'weeljack-ng/inputnumber';

@Component({
  selector: 'docs-inputnumber-min-max-and-spin-buttons-example',
  imports: [WjField, WjInputNumber],
  template: `
    <wj-field label="Guests" hint="From 1 to 12.">
      <wj-inputnumber showButtons [min]="1" [max]="12" [value]="2" />
    </wj-field>
  `,
  styles: `
    :host {
      display: grid;
      inline-size: min(100%, 24rem);
    }
  `,
})
export class InputNumberMinMaxAndSpinButtonsExample {}
