import { Component } from '@angular/core';
import { WjField } from 'weeljack-ng/field';
import { WjInputOtp } from 'weeljack-ng/inputotp';

@Component({
  selector: 'docs-inputotp-in-a-field-example',
  imports: [WjField, WjInputOtp],
  template: `
    <wj-field label="Verification code" hint="Check your email for the code.">
      <wj-inputotp [length]="4" />
    </wj-field>
    <wj-field label="Backup code" error="Enter all 6 characters.">
      <wj-inputotp [length]="6" value="ab12" />
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
export class InputOtpInAFieldExample {}
