import { Component } from '@angular/core';
import { WjField } from 'weeljack-ng/field';
import { WjInputText } from 'weeljack-ng/inputtext';

@Component({
  selector: 'docs-inputtext-in-a-field-example',
  imports: [WjField, WjInputText],
  template: `
    <wj-field label="Email" hint="We only use it to send your receipt.">
      <input wjInputText type="email" autocomplete="email" placeholder="name@example.com" />
    </wj-field>
    <wj-field label="Phone number" error="Enter a phone number with its area code.">
      <input wjInputText type="tel" autocomplete="tel" />
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
export class InputTextInAFieldExample {}
