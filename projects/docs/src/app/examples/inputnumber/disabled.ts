import { Component } from '@angular/core';
import { WjField } from 'weeljack-ng/field';
import { WjInputNumber } from 'weeljack-ng/inputnumber';

@Component({
  selector: 'docs-inputnumber-disabled-example',
  imports: [WjField, WjInputNumber],
  template: `
    <wj-field label="Quantity">
      <wj-inputnumber showButtons disabled [value]="3" />
    </wj-field>
  `,
  styles: `
    :host {
      display: grid;
      inline-size: min(100%, 24rem);
    }
  `,
})
export class InputNumberDisabledExample {}
