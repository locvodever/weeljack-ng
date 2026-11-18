import { Component } from '@angular/core';
import { WjField } from 'weeljack-ng/field';
import { WjInputMask } from 'weeljack-ng/inputmask';

@Component({
  selector: 'docs-inputmask-sizes-example',
  imports: [WjField, WjInputMask],
  template: `
    <wj-field label="Small">
      <input wjInputMask="(999) 999-9999" [size]="'small'" placeholder="(555) 555-0123" />
    </wj-field>
    <wj-field label="Default">
      <input wjInputMask="(999) 999-9999" placeholder="(555) 555-0123" />
    </wj-field>
    <wj-field label="Large">
      <input wjInputMask="(999) 999-9999" [size]="'large'" placeholder="(555) 555-0123" />
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
export class InputMaskSizesExample {}
