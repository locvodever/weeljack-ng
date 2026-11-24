import { Component } from '@angular/core';
import { WjField } from 'weeljack-ng/field';
import { WjInputOtp } from 'weeljack-ng/inputotp';

@Component({
  selector: 'docs-inputotp-disabled-example',
  imports: [WjField, WjInputOtp],
  template: `
    <wj-field label="Verification code">
      <wj-inputotp disabled [length]="4" value="1234" />
    </wj-field>
  `,
  styles: `
    :host {
      display: grid;
      inline-size: min(100%, 24rem);
    }
  `,
})
export class InputOtpDisabledExample {}
