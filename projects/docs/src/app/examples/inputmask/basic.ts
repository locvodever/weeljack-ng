import { Component } from '@angular/core';
import { WjInputMask } from 'weeljack-ng/inputmask';

@Component({
  selector: 'docs-inputmask-basic-example',
  imports: [WjInputMask],
  template: `
    <label for="basic-phone">Phone number</label>
    <input
      wjInputMask="(999) 999-9999"
      id="basic-phone"
      type="tel"
      autocomplete="tel"
      placeholder="(555) 555-0123"
    />
  `,
  styles: `
    :host {
      display: flex;
      flex-wrap: wrap;
      align-items: center;
      gap: 8px;
    }
  `,
})
export class InputMaskBasicExample {}
