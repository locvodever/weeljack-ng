import { Component } from '@angular/core';
import { WjField } from 'weeljack-ng/field';
import { WjToggleButton } from 'weeljack-ng/togglebutton';

@Component({
  selector: 'docs-togglebutton-disabled-example',
  imports: [WjField, WjToggleButton],
  template: `
    <wj-field label="Email me a receipt" hint="Managed by your administrator.">
      <wj-togglebutton disabled />
    </wj-field>
    <wj-field label="Keep me signed in" hint="Managed by your administrator.">
      <wj-togglebutton disabled [checked]="true" />
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
export class ToggleButtonDisabledExample {}
