import { Component } from '@angular/core';
import { WjField } from 'weeljack-ng/field';
import { WjInputOtp } from 'weeljack-ng/inputotp';

@Component({
  selector: 'docs-inputotp-six-digits-example',
  imports: [WjField, WjInputOtp],
  template: `
    <wj-field label="Sign-in code" hint="Enter the 6 digits we sent you.">
      <wj-inputotp integerOnly [length]="6" />
    </wj-field>
  `,
  styles: `
    :host {
      display: grid;
      inline-size: min(100%, 24rem);
    }
  `,
})
export class InputOtpSixDigitsExample {}
