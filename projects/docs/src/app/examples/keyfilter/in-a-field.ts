import { Component } from '@angular/core';
import { WjField } from 'weeljack-ng/field';
import { WjInputText } from 'weeljack-ng/inputtext';
import { WjKeyFilter } from 'weeljack-ng/keyfilter';

@Component({
  selector: 'docs-keyfilter-in-a-field-example',
  imports: [WjField, WjInputText, WjKeyFilter],
  template: `
    <wj-field label="Postcode" hint="Digits only.">
      <input wjInputText wjKeyFilter="pint" inputmode="numeric" autocomplete="postal-code" />
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
export class KeyFilterInAFieldExample {}
