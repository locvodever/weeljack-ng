import { Component } from '@angular/core';
import { WjInputMask } from 'weeljack-ng/inputmask';

@Component({
  selector: 'docs-inputmask-disabled-example',
  imports: [WjInputMask],
  template: `
    <label for="disabled-phone">Phone number</label>
    <input wjInputMask="(999) 999-9999" id="disabled-phone" disabled value="(555) 555-0123" />
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
export class InputMaskDisabledExample {}
