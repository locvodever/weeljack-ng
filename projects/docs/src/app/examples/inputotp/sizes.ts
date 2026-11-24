import { Component } from '@angular/core';
import { WjField } from 'weeljack-ng/field';
import { WjInputOtp } from 'weeljack-ng/inputotp';

@Component({
  selector: 'docs-inputotp-sizes-example',
  imports: [WjField, WjInputOtp],
  template: `
    <wj-field label="Small">
      <wj-inputotp size="small" [length]="4" />
    </wj-field>
    <wj-field label="Default">
      <wj-inputotp [length]="4" />
    </wj-field>
    <wj-field label="Large">
      <wj-inputotp size="large" [length]="4" />
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
export class InputOtpSizesExample {}
