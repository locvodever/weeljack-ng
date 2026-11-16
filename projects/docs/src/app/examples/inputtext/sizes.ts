import { Component } from '@angular/core';
import { WjField } from 'weeljack-ng/field';
import { WjInputText } from 'weeljack-ng/inputtext';

@Component({
  selector: 'docs-inputtext-sizes-example',
  imports: [WjField, WjInputText],
  template: `
    <wj-field label="Small">
      <input wjInputText [size]="'small'" />
    </wj-field>
    <wj-field label="Default">
      <input wjInputText />
    </wj-field>
    <wj-field label="Large">
      <input wjInputText [size]="'large'" />
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
export class InputTextSizesExample {}
