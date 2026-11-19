import { Component } from '@angular/core';
import { WjField } from 'weeljack-ng/field';
import { WjToggleButton } from 'weeljack-ng/togglebutton';

@Component({
  selector: 'docs-togglebutton-in-a-field-example',
  imports: [WjField, WjToggleButton],
  template: `
    <wj-field label="Keep me signed in" hint="Only on a device you trust.">
      <wj-togglebutton />
    </wj-field>
    <wj-field label="Agree to the terms" error="Agree to the terms to continue.">
      <wj-togglebutton />
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
export class ToggleButtonInAFieldExample {}
