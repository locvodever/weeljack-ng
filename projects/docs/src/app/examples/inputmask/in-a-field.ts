import { Component } from '@angular/core';
import { WjField } from 'weeljack-ng/field';
import { WjInputMask } from 'weeljack-ng/inputmask';

@Component({
  selector: 'docs-inputmask-in-a-field-example',
  imports: [WjField, WjInputMask],
  template: `
    <wj-field label="Phone number" hint="Include the area code.">
      <input
        wjInputMask="(999) 999-9999"
        type="tel"
        autocomplete="tel"
        placeholder="(555) 555-0123"
      />
    </wj-field>
    <wj-field label="Start date" error="Enter the full date as mm/dd/yyyy.">
      <input wjInputMask="99/99/9999" inputmode="numeric" placeholder="mm/dd/yyyy" />
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
export class InputMaskInAFieldExample {}
