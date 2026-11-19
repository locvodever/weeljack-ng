import { Component } from '@angular/core';
import { WjField } from 'weeljack-ng/field';
import { WjToggleButton } from 'weeljack-ng/togglebutton';

@Component({
  selector: 'docs-togglebutton-sizes-example',
  imports: [WjField, WjToggleButton],
  template: `
    <wj-field label="Small">
      <wj-togglebutton size="small" />
    </wj-field>
    <wj-field label="Default">
      <wj-togglebutton />
    </wj-field>
    <wj-field label="Large">
      <wj-togglebutton size="large" />
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
export class ToggleButtonSizesExample {}
