import { Component } from '@angular/core';
import { WjField } from 'weeljack-ng/field';
import { WjInputOtp } from 'weeljack-ng/inputotp';

@Component({
  selector: 'docs-inputotp-masked-example',
  imports: [WjField, WjInputOtp],
  template: `
    <wj-field label="PIN">
      <wj-inputotp mask integerOnly [length]="4" value="1234" />
    </wj-field>
  `,
  styles: `
    :host {
      display: grid;
      inline-size: min(100%, 24rem);
    }
  `,
})
export class InputOtpMaskedExample {}
